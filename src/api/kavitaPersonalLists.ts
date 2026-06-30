import type { LibrarySortMode } from '../utils/seriesPagination';
import type { SeriesGridMode } from '../types/kavita';
import {
  KAVITA_FILTER_COMBINATION_AND,
  KAVITA_SORT_FIELD,
  type KavitaFilterV2Body,
} from './kavitaFilterV2';

/** 1-based page number for Kavita query params. */
export function toKavitaApiPageNumber(pageNumber: number): number {
  return pageNumber + 1;
}

export function buildPagedQueryParams(
  pageNumber: number,
  pageSize: number,
  extra?: Record<string, number>
): Record<string, number> {
  return {
    PageNumber: toKavitaApiPageNumber(pageNumber),
    PageSize: pageSize,
    ...extra,
  };
}

export function buildOnDeckQueryParams(
  pageNumber: number,
  pageSize: number,
  libraryId?: number
): Record<string, number> {
  if (libraryId != null) {
    return buildPagedQueryParams(pageNumber, pageSize, { libraryId });
  }
  return buildPagedQueryParams(pageNumber, pageSize);
}

export function buildWantToReadUpdateBody(seriesIds: number[]): { seriesIds: number[] } {
  return { seriesIds };
}

/** Empty filter for want-to-read v2 list (server scopes to user's list). */
export function buildWantToReadFilterBody(): KavitaFilterV2Body {
  return {
    statements: [],
    combination: KAVITA_FILTER_COMBINATION_AND,
    sortOptions: { sortField: KAVITA_SORT_FIELD.SortName, isAscending: true },
  };
}

export const KAVITA_PERSONAL_LIST_PATHS = {
  onDeck: '/api/Series/on-deck',
  removeFromOnDeck: '/api/Series/remove-from-on-deck',
  wantToReadV2: '/api/want-to-read/v2',
  wantToReadAdd: '/api/want-to-read/add-series',
  wantToReadRemove: '/api/want-to-read/remove-series',
  wantToReadCheck: '/api/want-to-read',
} as const;

export function resolveSeriesGridMode(params: {
  gridMode?: SeriesGridMode;
  collectionId?: number;
  libraryId?: number;
}): SeriesGridMode {
  if (params.gridMode) return params.gridMode;
  if (params.collectionId != null) return 'collection';
  return 'library';
}
