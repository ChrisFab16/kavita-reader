import type { PaginationMetadata, SeriesDto } from '../types/kavita';
import type { LibrarySortMode } from '../api/kavitaFilterV2';
import { sortOptionsForLibrarySort } from '../api/kavitaFilterV2';

export type { LibrarySortMode };

export function mergeSeriesPages(existing: SeriesDto[], incoming: SeriesDto[]): SeriesDto[] {
  if (incoming.length === 0) {
    return existing;
  }

  const seen = new Set(existing.map((item) => item.id));
  const appended = incoming.filter((item) => !seen.has(item.id));
  return appended.length === 0 ? existing : [...existing, ...appended];
}

export function hasMoreSeriesPages(
  pagination: PaginationMetadata | null,
  resultCount: number,
  pageSize: number
): boolean {
  if (pagination?.hasNextPage != null) {
    return pagination.hasNextPage;
  }

  if (pagination?.totalPages != null && pagination?.currentPage != null) {
    // Kavita uses 1-based currentPage in API responses.
    return pagination.currentPage < pagination.totalPages;
  }

  // Only use result-count fallback when the server did not send pagination metadata.
  if (pagination == null) {
    return resultCount >= pageSize;
  }

  return false;
}

export function sortOptionsForMode(sortBy: LibrarySortMode) {
  return sortOptionsForLibrarySort(sortBy);
}
