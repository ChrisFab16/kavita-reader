/** Shared page-index logic for reader prefetch (011) and offline download (012). */

export type PageWarmSettings = {
  prefetchPages: number;
  cacheEntireAlbum: boolean;
};

export const PREFETCH_CONCURRENCY = 2;
export const FULL_ALBUM_CONCURRENCY = 3;

/** Page indices to warm or download (0-based, excludes current unless full-album). */
export function getPageWarmIndices(
  currentPage: number,
  totalPages: number,
  settings: PageWarmSettings
): number[] {
  if (totalPages <= 0) {
    return [];
  }

  if (settings.cacheEntireAlbum) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const ahead = Math.max(0, settings.prefetchPages);
  if (ahead === 0) {
    return [];
  }

  const indices: number[] = [];
  for (let page = currentPage + 1; page <= currentPage + ahead && page < totalPages; page += 1) {
    indices.push(page);
  }
  return indices;
}

export function warmConcurrency(settings: PageWarmSettings): number {
  return settings.cacheEntireAlbum ? FULL_ALBUM_CONCURRENCY : PREFETCH_CONCURRENCY;
}

export function offlinePageFileName(pageIndex: number): string {
  return `page-${pageIndex}.img`;
}
