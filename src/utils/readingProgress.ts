import type { ChapterInfoDto, ProgressDto } from '../types/kavita';

export interface ProgressSaveHints {
  seriesIdFallback?: number;
  volumeIdFallback?: number;
  libraryIdFallback?: number;
  progressHint?: ProgressDto | null;
  bookScrollId?: string | null;
}

export class ProgressPayloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProgressPayloadError';
  }
}

function pickId(...candidates: Array<number | undefined>): number {
  for (const value of candidates) {
    if (typeof value === 'number' && value > 0) {
      return value;
    }
  }
  return 0;
}

/** Build a Kavita ProgressDto for POST /api/Reader/progress. */
export function buildProgressPayload(
  chapterInfo: ChapterInfoDto,
  chapterId: number,
  pageNum: number,
  hints: ProgressSaveHints = {}
): ProgressDto {
  const progressHint = hints.progressHint ?? null;
  return {
    seriesId: pickId(chapterInfo.seriesId, progressHint?.seriesId, hints.seriesIdFallback),
    volumeId: pickId(chapterInfo.volumeId, progressHint?.volumeId, hints.volumeIdFallback),
    chapterId,
    pageNum,
    libraryId: pickId(chapterInfo.libraryId, progressHint?.libraryId, hints.libraryIdFallback),
    ...(hints.bookScrollId ? { bookScrollId: hints.bookScrollId } : {}),
  };
}

export function validateProgressPayload(payload: ProgressDto): void {
  const missing: string[] = [];
  if (payload.seriesId <= 0) missing.push('seriesId');
  if (payload.volumeId <= 0) missing.push('volumeId');
  if (payload.chapterId <= 0) missing.push('chapterId');
  if (payload.libraryId <= 0) missing.push('libraryId');
  if (missing.length > 0) {
    throw new ProgressPayloadError(
      `Missing progress ids: ${missing.join(', ')} (chapter ${payload.chapterId}, page ${payload.pageNum})`
    );
  }
}
