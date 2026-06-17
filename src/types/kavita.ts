// types/kavita.ts
export interface KavitaServer {
  id: string;
  name: string;
  url: string;
  type: 'kavita' | 'opds';
  isDefault: boolean;
  lastSync?: Date;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface UserDto {
  username: string;
  email: string;
  token: string;
  refreshToken: string;
  apiKey: string;
  roles: string[];
}

export interface LibraryDto {
  id: number;
  name: string;
  type: LibraryType;
  lastScanned: string;
  folders: string[];
}

export enum LibraryType {
  Manga = 0,
  Comic = 1,
  Book = 2,
}

export interface SeriesDto {
  id: number;
  name: string;
  originalName: string;
  localizedName: string;
  sortName: string;
  summary: string;
  libraryId: number;
  coverImageLocked: boolean;
  pages: number;
  pagesRead: number;
  /** Volume count from list API (not an array of Volume objects). */
  volumes?: number;
  /** Chapter count from list API. */
  chapters?: number;
  format: MangaFormat;
  created: string;
  lastModified: string;
}

export interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  hasNextPage?: boolean;
}

export interface PaginatedSeriesResult {
  result: SeriesDto[];
  pagination: PaginationMetadata | null;
}

export enum MangaFormat {
  Unknown = 0,
  Archive = 1,
  Epub = 2,
  Pdf = 3,
  Image = 4,
}