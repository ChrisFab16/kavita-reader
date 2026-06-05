// src/api/kavitaClient.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserDto } from '../types/kavita';

export class KavitaClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private token: string | null = null;
  private refreshToken: string | null = null;
  private apiKey: string | null = null;

  // Per-server storage keys so multiple servers don't overwrite each other
  private tokenKey: string;
  private refreshTokenKey: string;
  private apiKeyKey: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');

    // Derive stable storage keys from the URL
    const urlKey = this.baseUrl.replace(/[^a-zA-Z0-9]/g, '_');
    this.tokenKey = `kavita_token_${urlKey}`;
    this.refreshTokenKey = `kavita_refresh_${urlKey}`;
    this.apiKeyKey = `kavita_apikey_${urlKey}`;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.loadStoredCredentials();
  }

  private async loadStoredCredentials(): Promise<void> {
    try {
      const results = await AsyncStorage.multiGet([
        this.tokenKey,
        this.refreshTokenKey,
        this.apiKeyKey,
      ]);
      this.token = results[0][1];
      this.refreshToken = results[1][1];
      this.apiKey = results[2][1];
    } catch (e) {
      console.warn('Failed to load stored credentials:', e);
    }
  }

  // Call this when you need credentials guaranteed to be loaded before proceeding
  async ensureCredentialsLoaded(): Promise<void> {
    await this.loadStoredCredentials();
  }

  async isAuthenticated(): Promise<boolean> {
    await this.ensureCredentialsLoaded();
    return !!this.token;
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      async (config) => {
        if (!this.token) {
          this.token = await AsyncStorage.getItem(this.tokenKey);
        }
        if (this.token && config.headers) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            await this.clearTokens();
            throw refreshError;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing connection to:', this.baseUrl);
      const response = await this.client.get('/api/Health');
      console.log('✅ Connection successful!', response.status);
      return true;
    } catch (error: any) {
      console.error('❌ Connection failed:', error.message);

      if (error.code === 'ECONNABORTED') {
        console.error('Connection timed out');
      } else if (error.code === 'ERR_NETWORK') {
        console.error('Network error - check if server is running');
      } else if (error.response) {
        console.error('Server responded with:', error.response.status);
      } else if (error.request) {
        console.error('No response received from server');
      }

      return false;
    }
  }

  async login(username: string, password: string): Promise<UserDto> {
    try {
      const response = await this.client.post<UserDto>('/api/Account/login', {
        username,
        password,
      });

      const user = response.data;
      this.token = user.token;
      this.refreshToken = user.refreshToken;
      this.apiKey = user.apiKey;

      // Save using per-server keys so multiple servers don't collide
      await AsyncStorage.multiSet([
        [this.tokenKey, user.token],
        [this.refreshTokenKey, user.refreshToken],
        [this.apiKeyKey, user.apiKey],
      ]);

      return user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async refreshAccessToken(): Promise<string | null> {
    try {
      if (!this.refreshToken) {
        this.refreshToken = await AsyncStorage.getItem(this.refreshTokenKey);
      }

      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.client.post('/api/Account/refresh-token', {
        token: this.token,
        refreshToken: this.refreshToken,
      });

      const newToken = response.data.token;
      this.token = newToken;
      await AsyncStorage.setItem(this.tokenKey, newToken);

      return newToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    await this.clearTokens();
  }

  private async clearTokens(): Promise<void> {
    this.token = null;
    this.refreshToken = null;
    this.apiKey = null;
    await AsyncStorage.multiRemove([
      this.tokenKey,
      this.refreshTokenKey,
      this.apiKeyKey,
    ]);
  }

  async getLibraries(): Promise<any[]> {
    try {
      const response = await this.client.get('/api/Library/libraries');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getSeries(libraryId: number, pageNumber: number = 0, pageSize: number = 50): Promise<any[]> {
    try {
      const response = await this.client.post('/api/Series/all-v2', {
        libraryId,
        pageNumber,
        pageSize,
      });

      let seriesList: any[] = [];
      if (response.data.result) {
        seriesList = response.data.result;
      } else if (Array.isArray(response.data)) {
        seriesList = response.data;
      } else {
        console.warn('Unexpected response structure:', response.data);
        return [];
      }

      const enrichedSeries = await Promise.all(
        seriesList.map(async (series) => {
          try {
            const volumes = await this.getVolumes(series.id);
            const totalChapters = volumes.reduce((sum, vol) => {
              return sum + (vol.chapters?.length || 0);
            }, 0);
            return {
              ...series,
              volumeCount: volumes.length,
              chapterCount: totalChapters,
            };
          } catch (error) {
            console.warn(`Failed to get volumes for series ${series.id}:`, error);
            return series;
          }
        })
      );

      return enrichedSeries;
    } catch (error) {
      console.error('all-v2 failed, trying alternative endpoint');
      try {
        const response = await this.client.get('/api/Series/series', {
          params: { libraryId, pageNumber, pageSize }
        });
        return response.data || [];
      } catch (error2) {
        throw this.handleError(error);
      }
    }
  }

  async getSeriesById(seriesId: number): Promise<any> {
    try {
      const response = await this.client.get(`/api/Series/${seriesId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getVolumes(seriesId: number): Promise<any[]> {
    try {
      const response = await this.client.get(`/api/Series/volumes`, {
        params: { seriesId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getChapters(volumeId: number): Promise<any[]> {
    try {
      const response = await this.client.get(`/api/Series/chapter`, {
        params: { volumeId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getChapterInfo(chapterId: number): Promise<any> {
    try {
      const response = await this.client.get(`/api/Reader/chapter-info`, {
        params: { chapterId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // EPUB Support Methods
  async getBookInfo(chapterId: number): Promise<any> {
    try {
      console.log('📘 Fetching book info for chapter:', chapterId);
      const response = await this.client.get(`/api/Book/${chapterId}/book-info`);
      console.log('✅ Book info retrieved');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getBookPage(chapterId: number, page: number): Promise<string> {
    try {
      console.log(`📄 Fetching book page ${page} for chapter ${chapterId}`);
      const response = await this.client.get(`/api/Book/${chapterId}/book-page`, {
        params: { page }
      });
      console.log('✅ Book page retrieved');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getBookChapters(chapterId: number): Promise<any[]> {
    try {
      const response = await this.client.get(`/api/Book/${chapterId}/chapters`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async cacheChapter(chapterId: number): Promise<void> {
    try {
      const chapterInfo = await this.getChapterInfo(chapterId);
      const format = chapterInfo.seriesFormat;
      const fileName = chapterInfo.fileName || '';

      console.log('📄 Chapter format:', format);
      console.log('📁 File name:', fileName);

      const isPdf = fileName.toLowerCase().endsWith('.pdf');
      const isEpub = fileName.toLowerCase().endsWith('.epub');

      if (isEpub) {
        console.log('📘 EPUB detected - caching book info');
        await this.client.get(`/api/Book/${chapterId}/book-info`);
        console.log('✅ EPUB chapter cached successfully');
      } else if (isPdf || format === 3) {
        console.log('📕 PDF detected - will extract on demand');
        console.log('✅ PDF ready to load');
      } else {
        console.log('🖼️  Image-based format detected - caching first page');
        await this.client.get(`/api/Reader/image`, {
          params: {
            chapterId,
            page: 0,
            apiKey: this.apiKey
          }
        });
        console.log('✅ Image chapter cached successfully');
      }
    } catch (error) {
      console.log('❌ Cache failed:', error);
    }
  }

  async markProgress(seriesId: number, volumeId: number, chapterId: number, pageNum: number): Promise<void> {
    try {
      await this.client.post('/api/Reader/progress', {
        seriesId,
        volumeId,
        chapterId,
        pageNum,
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }

  getCoverImageUrl(seriesId: number): string {
    const params = new URLSearchParams({ seriesId: seriesId.toString() });
    if (this.apiKey) params.append('apiKey', this.apiKey);
    return `${this.baseUrl}/api/Image/series-cover?${params.toString()}`;
  }

  getVolumeCoverUrl(volumeId: number): string {
    const params = new URLSearchParams({ volumeId: volumeId.toString() });
    if (this.apiKey) params.append('apiKey', this.apiKey);
    return `${this.baseUrl}/api/Image/volume-cover?${params.toString()}`;
  }

  getChapterCoverUrl(chapterId: number): string {
    const params = new URLSearchParams({ chapterId: chapterId.toString() });
    if (this.apiKey) params.append('apiKey', this.apiKey);
    return `${this.baseUrl}/api/Image/chapter-cover?${params.toString()}`;
  }

  getPageImageUrl(chapterId: number, page: number): string {
    const params = new URLSearchParams({
      chapterId: chapterId.toString(),
      page: page.toString(),
    });
    if (this.apiKey) params.append('apiKey', this.apiKey);
    return `${this.baseUrl}/api/Reader/image?${params.toString()}`;
  }

  async cacheImages(chapterId: number): Promise<void> {
    try {
      await this.cacheChapter(chapterId);
    } catch (error) {
      console.log('Failed to cache images:', error);
    }
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        const status = axiosError.response.status;
        const message = (axiosError.response.data as any)?.message || axiosError.message;
        switch (status) {
          case 400: return new Error(`Bad Request: ${message}`);
          case 401: return new Error('Unauthorized. Please log in again.');
          case 403: return new Error('Forbidden. You do not have permission.');
          case 404: return new Error('Resource not found.');
          case 500: return new Error('Server error. Please try again later.');
          default:  return new Error(`Error ${status}: ${message}`);
        }
      } else if (axiosError.request) {
        return new Error('No response from server. Check your connection and server URL.');
      }
    }
    return new Error('An unexpected error occurred.');
  }

  getBaseUrl(): string { return this.baseUrl; }
  getToken(): string | null { return this.token; }
  getApiKey(): string | null { return this.apiKey; }
}