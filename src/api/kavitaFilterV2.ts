import type { LibrarySortMode } from '../utils/seriesPagination';

/** Kavita FilterV2 — enum values and library filter body.
 *  @see specs/contracts/kavita-filter-v2.md (canonical; keep in sync)
 */
export const KAVITA_FILTER_FIELD = {
  Libraries: 19,
} as const;

/** FilterComparison.Equal */
export const KAVITA_FILTER_COMPARISON_EQUAL = 0;

/** FilterCombination.And */
export const KAVITA_FILTER_COMBINATION_AND = 1;

/** SortField enum — see API/DTOs/Filtering/SortField.cs */
export const KAVITA_SORT_FIELD = {
  SortName: 1,
  CreatedDate: 2,
  LastModifiedDate: 3,
} as const;

export type KavitaFilterV2Body = {
  statements: Array<{
    field: number;
    comparison: number;
    value: string;
  }>;
  combination: number;
  sortOptions?: {
    sortField: number;
    isAscending: boolean;
  };
};

export function buildLibraryFilterBody(
  libraryId: number,
  sortBy?: LibrarySortMode
): KavitaFilterV2Body {
  const body: KavitaFilterV2Body = {
    statements: [
      {
        field: KAVITA_FILTER_FIELD.Libraries,
        comparison: KAVITA_FILTER_COMPARISON_EQUAL,
        value: String(libraryId),
      },
    ],
    combination: KAVITA_FILTER_COMBINATION_AND,
  };

  if (sortBy) {
    body.sortOptions = sortOptionsForLibrarySort(sortBy);
  }

  return body;
}

export function sortOptionsForLibrarySort(sortBy: LibrarySortMode) {
  if (sortBy === 'recent') {
    return { sortField: KAVITA_SORT_FIELD.CreatedDate, isAscending: false };
  }
  return { sortField: KAVITA_SORT_FIELD.SortName, isAscending: true };
}
