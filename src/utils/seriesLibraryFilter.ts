import type { SeriesDto } from '../types/kavita';

/** Keep only series whose libraryId matches; skip filter when API omits libraryId. */
export function filterSeriesForLibrary(series: SeriesDto[], libraryId: number): SeriesDto[] {
  if (series.length === 0) {
    return series;
  }

  const withLibraryId = series.filter(
    (item) => typeof item.libraryId === 'number' && item.libraryId > 0
  );

  if (withLibraryId.length === 0) {
    return series;
  }

  return withLibraryId.filter((item) => item.libraryId === libraryId);
}

/** True when the list contains series from libraries other than the requested one. */
export function hasCrossLibrarySeries(series: SeriesDto[], libraryId: number): boolean {
  return series.some(
    (item) => typeof item.libraryId === 'number' && item.libraryId > 0 && item.libraryId !== libraryId
  );
}
