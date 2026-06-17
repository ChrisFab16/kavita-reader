import { SeriesDto } from '../types/kavita';

/** Subtitle text for a series card from list API fields only. */
export function formatSeriesListSubtitle(item: SeriesDto): string {
  const chapterCount = item.chapters ?? 0;
  const volumeCount = item.volumes ?? 0;

  if (chapterCount > 1 && volumeCount <= 1) {
    return `${chapterCount} books`;
  }
  if (volumeCount > 1) {
    return `${volumeCount} volumes`;
  }
  if (item.pagesRead > 0 && item.pages > 0) {
    return `${item.pagesRead}/${item.pages} pages`;
  }
  if (item.pages > 0) {
    return `${item.pages} pages`;
  }
  if (chapterCount === 1) {
    return '1 book';
  }
  return '';
}

export function seriesProgressPercent(item: SeriesDto): number {
  if (!item.pagesRead || !item.pages) return 0;
  return Math.min(100, (item.pagesRead / item.pages) * 100);
}
