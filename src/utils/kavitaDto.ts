import type { ChapterInfoDto, ProgressDto } from '../types/kavita';
import { MangaFormat } from '../types/kavita';

/** Read a numeric Kavita field (camelCase or PascalCase JSON). */
export function readKavitaInt(source: Record<string, unknown>, key: string): number {
  const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
  const value = source[key] ?? source[pascalKey];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function readKavitaString(source: Record<string, unknown>, key: string): string {
  const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
  const value = source[key] ?? source[pascalKey];
  return typeof value === 'string' ? value : '';
}

export function normalizeChapterInfo(raw: unknown): ChapterInfoDto {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const format = readKavitaInt(data, 'seriesFormat');
  return {
    chapterNumber: readKavitaString(data, 'chapterNumber'),
    volumeNumber: readKavitaString(data, 'volumeNumber'),
    volumeId: readKavitaInt(data, 'volumeId'),
    seriesName: readKavitaString(data, 'seriesName'),
    seriesId: readKavitaInt(data, 'seriesId'),
    libraryId: readKavitaInt(data, 'libraryId'),
    title: readKavitaString(data, 'title') || readKavitaString(data, 'seriesName'),
    pages: readKavitaInt(data, 'pages'),
    fileName: readKavitaString(data, 'fileName') || null,
    seriesFormat: format in MangaFormat ? format : MangaFormat.Unknown,
  };
}

export function normalizeProgressDto(raw: unknown): ProgressDto {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const bookScrollId = data.bookScrollId ?? data.BookScrollId;
  return {
    volumeId: readKavitaInt(data, 'volumeId'),
    chapterId: readKavitaInt(data, 'chapterId'),
    pageNum: readKavitaInt(data, 'pageNum'),
    seriesId: readKavitaInt(data, 'seriesId'),
    libraryId: readKavitaInt(data, 'libraryId'),
    bookScrollId: typeof bookScrollId === 'string' ? bookScrollId : null,
  };
}

export function extractApiErrorMessage(data: unknown, fallback: string): string {
  if (typeof data === 'string' && data.trim().length > 0) {
    return data.trim();
  }
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (typeof record.message === 'string' && record.message.trim()) {
      return record.message.trim();
    }
    if (typeof record.title === 'string' && record.title.trim()) {
      return record.title.trim();
    }
    if (record.errors && typeof record.errors === 'object') {
      return JSON.stringify(record.errors);
    }
  }
  return fallback;
}
