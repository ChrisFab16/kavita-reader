// src/api/kavitaClient.ts
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponseHeaders } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PaginatedSeriesResult,
  SeriesDto,
  UserDto,
  CollectionTagDto,
  ProgressDto,
  ChapterInfoDto,
} from '../types/kavita';
import { filterSeriesForLibrary, hasCrossLibrarySeries } from '../utils/seriesLibraryFilter';
import { parsePaginationHeader } from '../utils/kavitaPagination';
import { buildLibraryFilterBody } from './kavitaFilterV2';
import type { LibrarySortMode } from '../utils/seriesPagination';
import {
  extractApiErrorMessage,
  normalizeChapterInfo,
  normalizeProgressDto,
} from '../utils/kavitaDto';
import { validateProgressPayload } from '../utils/readingProgress';
import { isPdfChapter } from '../utils/readerChapter';

export type PageImageAuthSource = {
  uri: string;
  headers: { Authorization: string };
};

export type ChapterInfoRequestOptions = {
  extractPdf?: boolean;
  includeDimensions?: boolean;
};

export type PageImageUrlOptions = {
  extractPdf?: boolean;
};

const PUBLIC_API_PATHS = new Set([
  '/api/health',
  '/api/account/login',
  '/api/account/refresh-token',
  '/api/account/register',
]);

function normalizeApiPath(url?: string): string {
  if (!url) return '';
  const withoutQuery = url.split('?')[0];
  const pathOnly = withoutQuery.replace(/^https?:\/\/[^/]+/i, '');
  return pathOnly.toLowerCase();
}

function isPublicApiRoute(url?: string): boolean {
  return PUBLIC_API_PATHS.has(normalizeApiPath(url));
}

function storageKeysForBaseUrl(baseUrl: string) {
  const normalized = baseUrl.replace(/\/$/, '');
  const urlKey = normalized.replace(/[^a-zA-Z0-9]/g, '_');
  return {
    tokenKey: `kavita_token_${urlKey}`,
    refreshTokenKey: `kavita_refresh_${urlKey}`,
    apiKeyKey: `kavita_apikey_${urlKey}`,
  };
}

export class KavitaClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private token: string | null = null;
  private refreshToken: string | null = null;
  private apiKey: string | null = null;

  private tokenKey: string;
  private refreshTokenKey: string;
  private apiKeyKey: string;
  private credentialsLoadPromise: Promise<void>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');

    const keys = storageKeysForBaseUrl(this.baseUrl);
    this.tokenKey = keys.tokenKey;
    this.refreshTokenKey = keys.refreshTokenKey;
    this.apiKeyKey = keys.apiKeyKey;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.credentialsLoadPromise = this.loadStoredCredentials();
    this.setupInterceptors();
  }

  static async clearStoredCredentials(baseUrl: string): Promise<void> {
    const keys = storageKeysForBaseUrl(baseUrl);
    await AsyncStorage.multiRemove([
      keys.tokenKey,
      keys.refreshTokenKey,
      keys.apiKeyKey,
    ]);
  }

  static async hasStoredCredentials(baseUrl: string): Promise<boolean> {
    const keys = storageKeysForBaseUrl(baseUrl);
    const token = await AsyncStorage.getItem(keys.tokenKey);
    return !!token;
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

  async ensureCredentialsLoaded(): Promise<void> {
    await this.credentialsLoadPromise;
  }

  async isAuthenticated(): Promise<boolean> {
    await this.ensureCredentialsLoaded();
    return !!this.token;
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        if (isPublicApiRoute(config.url)) {
          if (config.headers) {
            delete config.headers.Authorization;
          }
          return config;
        }

        await this.ensureCredentialsLoaded();

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
        const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

        if (
          !originalRequest ||
          error.response?.status !== 401 ||
          originalRequest._retry ||
          isPublicApiRoute(originalRequest.url)
        ) {
          return Promise.reject(error);
        }

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
    await this.clearTokens();

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
    this.credentialsLoadPromise = Promise.resolve();
  }

  async getLibraries(): Promise<any[]> {
    try {
      const response = await this.client.get('/api/Library/libraries');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getCollections(): Promise<CollectionTagDto[]> {
    try {
      const response = await this.client.get('/api/Collection');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private parseSeriesListResponse(
    data: unknown,
    responseHeaders?: AxiosResponseHeaders | Record<string, unknown>
  ): PaginatedSeriesResult {
    const paginationFromHeader = parsePaginationHeader(responseHeaders ?? null);

    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const obj = data as Record<string, unknown>;
      const paginationFromBody =
        (obj.pagination as PaginatedSeriesResult['pagination']) ??
        (obj.paginationMetadata as PaginatedSeriesResult['pagination']) ??
        null;
      const pagination = paginationFromBody ?? paginationFromHeader;

      for (const key of ['result', 'items', 'series', 'results'] as const) {
        const candidate = obj[key];
        if (Array.isArray(candidate)) {
          return { result: candidate as SeriesDto[], pagination };
        }
      }
    }

    if (Array.isArray(data)) {
      return { result: data as SeriesDto[], pagination: paginationFromHeader };
    }

    console.warn('Unexpected series list response structure:', data);
    return { result: [], pagination: paginationFromHeader };
  }

  /** Kavita query params use 1-based page numbers. */
  private toApiPageNumber(pageNumber: number): number {
    return pageNumber + 1;
  }

  private buildSeriesQueryParams(libraryId: number, pageNumber: number, pageSize: number) {
    return {
      libraryId,
      PageNumber: this.toApiPageNumber(pageNumber),
      PageSize: pageSize,
    };
  }

  private noCacheHeaders(noCache?: boolean) {
    return noCache
      ? { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }
      : undefined;
  }

  private libraryFilterBody(libraryId: number, sortBy?: LibrarySortMode) {
    return buildLibraryFilterBody(libraryId, sortBy);
  }

  private scopeSeriesToLibrary(series: SeriesDto[], libraryId: number): SeriesDto[] {
    return filterSeriesForLibrary(series, libraryId);
  }

  async getSeriesList(
    libraryId: number,
    pageNumber: number = 0,
    pageSize: number = 50,
    options?: { noCache?: boolean; sortBy?: LibrarySortMode }
  ): Promise<PaginatedSeriesResult> {
    const headers = this.noCacheHeaders(options?.noCache);
    const sortBy = options?.sortBy ?? 'name';
    const queryParams = this.buildSeriesQueryParams(libraryId, pageNumber, pageSize);
    const filterBody = this.libraryFilterBody(libraryId, sortBy);
    const filterBodyNoSort = this.libraryFilterBody(libraryId);

    const attempts: Array<() => Promise<PaginatedSeriesResult>> = [
      async () => {
        const response = await this.client.post('/api/Series/all-v2', filterBodyNoSort, {
          params: queryParams,
          headers,
        });
        return this.parseSeriesListResponse(response.data, response.headers);
      },
      async () => {
        const response = await this.client.post('/api/Series/all-v2', filterBody, {
          params: queryParams,
          headers,
        });
        return this.parseSeriesListResponse(response.data, response.headers);
      },
      async () => {
        const response = await this.client.post('/api/Series/v2', filterBodyNoSort, {
          params: queryParams,
          headers,
        });
        return this.parseSeriesListResponse(response.data, response.headers);
      },
    ];

    for (const attempt of attempts) {
      try {
        const parsed = await attempt();
        const scoped = this.scopeSeriesToLibrary(parsed.result, libraryId);

        if (scoped.length === 0) {
          continue;
        }

        if (hasCrossLibrarySeries(parsed.result, libraryId)) {
          continue;
        }

        return { result: scoped, pagination: parsed.pagination };
      } catch (error) {
        console.error('getSeriesList attempt failed:', error);
      }
    }

    return { result: [], pagination: null };
  }

  async getAllSeriesInLibrary(
    libraryId: number,
    options?: { noCache?: boolean; pageSize?: number }
  ): Promise<SeriesDto[]> {
    const pageSize = options?.pageSize ?? 100;
    const collected: SeriesDto[] = [];
    let page = 0;

    while (true) {
      const { result, pagination } = await this.getSeriesList(libraryId, page, pageSize, options);
      collected.push(...result);

      const totalPages = pagination?.totalPages;
      if (totalPages != null && page + 1 >= totalPages) {
        break;
      }
      if (result.length === 0 || result.length < pageSize) {
        break;
      }
      page += 1;
      if (page > 200) {
        break;
      }
    }

    return collected;
  }

  async getSeriesByCollectionList(
    collectionId: number,
    pageNumber: number = 0,
    pageSize: number = 100,
    options?: { noCache?: boolean }
  ): Promise<PaginatedSeriesResult> {
    try {
      const response = await this.client.get('/api/Series/series-by-collection', {
        params: {
          collectionId,
          PageNumber: this.toApiPageNumber(pageNumber),
          PageSize: pageSize,
        },
        headers: this.noCacheHeaders(options?.noCache),
      });
      return this.parseSeriesListResponse(response.data, response.headers);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAllSeriesByCollection(
    collectionId: number,
    options?: { noCache?: boolean; pageSize?: number }
  ): Promise<SeriesDto[]> {
    const pageSize = options?.pageSize ?? 100;
    const collected: SeriesDto[] = [];
    let page = 0;

    while (true) {
      const { result, pagination } = await this.getSeriesByCollectionList(
        collectionId,
        page,
        pageSize,
        options
      );
      collected.push(...result);

      const totalPages = pagination?.totalPages;
      if (totalPages != null && page + 1 >= totalPages) {
        break;
      }
      if (result.length === 0 || result.length < pageSize) {
        break;
      }
      page += 1;
      if (page > 200) {
        break;
      }
    }

    return collected;
  }

  /** Returns series for a library page without per-item volume fetches. */
  async getSeries(
    libraryId: number,
    pageNumber: number = 0,
    pageSize: number = 50,
    options?: { noCache?: boolean; sortBy?: LibrarySortMode }
  ): Promise<SeriesDto[]> {
    const { result } = await this.getSeriesList(libraryId, pageNumber, pageSize, options);
    return this.scopeSeriesToLibrary(result, libraryId);
  }

  /** Returns one page of series for a Kavita collection tag. */
  async getSeriesByCollection(
    collectionId: number,
    pageNumber: number = 0,
    pageSize: number = 100,
    options?: { noCache?: boolean }
  ): Promise<SeriesDto[]> {
    const { result } = await this.getSeriesByCollectionList(collectionId, pageNumber, pageSize, options);
    return result;
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

  async getChapterInfo(
    chapterId: number,
    options?: ChapterInfoRequestOptions
  ): Promise<ChapterInfoDto> {
    try {
      const params: Record<string, string | number | boolean> = { chapterId };
      if (options?.extractPdf) {
        params.extractPdf = true;
      }
      if (options?.includeDimensions) {
        params.includeDimensions = true;
      }
      const response = await this.client.get(`/api/Reader/chapter-info`, { params });
      return normalizeChapterInfo(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /** PDF chapters: warm server cache and fetch page dimensions (Q6 A+C). */
  async getChapterInfoForReader(chapterId: number): Promise<ChapterInfoDto> {
    const initial = await this.getChapterInfo(chapterId);
    if (!isPdfChapter(initial)) {
      return initial;
    }
    return this.getChapterInfo(chapterId, {
      extractPdf: true,
      includeDimensions: true,
    });
  }

  async getProgress(chapterId: number): Promise<ProgressDto> {
    try {
      const response = await this.client.get(`/api/Reader/get-progress`, {
        params: { chapterId },
      });
      return normalizeProgressDto(response.data);
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

  async markProgress(payload: ProgressDto): Promise<void> {
    const resolved = await this.resolveProgressPayload(payload);
    validateProgressPayload(resolved);

    try {
      console.log('[progress] POST /api/Reader/progress', JSON.stringify(resolved));
      await this.client.post('/api/Reader/progress', {
        seriesId: resolved.seriesId,
        volumeId: resolved.volumeId,
        chapterId: resolved.chapterId,
        pageNum: resolved.pageNum,
        libraryId: resolved.libraryId,
        ...(resolved.bookScrollId ? { bookScrollId: resolved.bookScrollId } : {}),
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.warn(
          '[progress] save failed',
          error.response.status,
          extractApiErrorMessage(error.response.data, error.message)
        );
      }
      throw this.handleError(error);
    }
  }

  /** Fill missing ids from chapter-info / get-progress / series metadata. */
  private async resolveProgressPayload(payload: ProgressDto): Promise<ProgressDto> {
    if (
      payload.seriesId > 0 &&
      payload.volumeId > 0 &&
      payload.libraryId > 0
    ) {
      return payload;
    }

    const [chapterInfo, progress] = await Promise.all([
      this.getChapterInfo(payload.chapterId),
      this.getProgress(payload.chapterId),
    ]);

    let seriesId = payload.seriesId || chapterInfo.seriesId || progress.seriesId;
    let volumeId = payload.volumeId || chapterInfo.volumeId || progress.volumeId;
    let libraryId = payload.libraryId || chapterInfo.libraryId || progress.libraryId;

    if (libraryId <= 0 && seriesId > 0) {
      const series = await this.getSeriesById(seriesId);
      const raw = series && typeof series === 'object' ? series as Record<string, unknown> : {};
      libraryId = typeof raw.libraryId === 'number'
        ? raw.libraryId
        : typeof raw.LibraryId === 'number'
          ? raw.LibraryId
          : libraryId;
    }

    return {
      ...payload,
      seriesId,
      volumeId,
      libraryId,
    };
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

  getPageImageUrl(
    chapterId: number,
    page: number,
    options?: PageImageUrlOptions
  ): string {
    const params = new URLSearchParams({
      chapterId: chapterId.toString(),
      page: page.toString(),
    });
    if (options?.extractPdf) {
      params.append('extractPdf', 'true');
    }
    if (this.apiKey) params.append('apiKey', this.apiKey);
    return `${this.baseUrl}/api/Reader/image?${params.toString()}`;
  }

  getPageImageAuthSource(
    chapterId: number,
    page: number,
    options?: PageImageUrlOptions
  ): PageImageAuthSource {
    const token = this.token;
    if (!token) {
      throw new Error('Not authenticated');
    }
    return {
      uri: this.getPageImageUrl(chapterId, page, options),
      headers: { Authorization: `Bearer ${token}` },
    };
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
        const message = extractApiErrorMessage(
          axiosError.response.data,
          axiosError.message
        );
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