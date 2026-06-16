import type { VolumeChapterItem, VolumeListItem } from './volumeDisplay';
import {
  chaptersToRender,
  formatChapterTitle,
  formatVolumeTitle,
  shouldCollapseVolumeToHeader,
  shouldHideVolumeHeader,
} from './volumeDisplay';
export type SeriesDetailRow =
  | { kind: 'volume-header'; key: string; volume: VolumeListItem }
  | { kind: 'volume-card'; key: string; volume: VolumeListItem; chapter: VolumeChapterItem }
  | { kind: 'chapter'; key: string; volume: VolumeListItem; chapter: VolumeChapterItem; chapterIndex: number };

/** Flatten volumes into FlatList rows (same layout rules as legacy ScrollView). */
export function buildSeriesDetailRows(volumes: VolumeListItem[]): SeriesDetailRow[] {
  const rows: SeriesDetailRow[] = [];

  for (const volume of volumes) {
    const chapters = volume.chapters ?? [];
    const hideHeader = shouldHideVolumeHeader(volume, volumes);
    const collapsed = shouldCollapseVolumeToHeader(volume, volumes);
    const primaryChapter = collapsed ? chapters[0] : null;
    const visibleChapters = chaptersToRender(volume, volumes);

    if (!hideHeader) {
      if (primaryChapter) {
        rows.push({
          kind: 'volume-card',
          key: `vol-card-${volume.id}`,
          volume,
          chapter: primaryChapter,
        });
      } else {
        rows.push({
          kind: 'volume-header',
          key: `vol-header-${volume.id}`,
          volume,
        });
      }
    }

    visibleChapters.forEach((chapter, chapterIndex) => {
      rows.push({
        kind: 'chapter',
        key: `chapter-${chapter.id}`,
        volume,
        chapter,
        chapterIndex,
      });
    });
  }

  return rows;
}

function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

/** Searchable text for a chapter row (volume + chapter labels). */
export function chapterSearchText(
  chapter: VolumeChapterItem,
  volume: VolumeListItem,
  chapterIndex: number
): string {
  const parts = [
    formatChapterTitle(chapter, volume, chapterIndex),
    chapter.titleName,
    chapter.range,
    chapter.fileName,
    formatVolumeTitle(volume),
    volume.name,
  ];
  return parts
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .join(' ')
    .toLowerCase();
}

/** Client-side filter before flattening rows for series detail search. */
export function filterVolumesForSearch(
  volumes: VolumeListItem[],
  query: string
): VolumeListItem[] {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) return volumes;

  return volumes
    .map((volume) => {
      const volumeTitle = formatVolumeTitle(volume).toLowerCase();
      const volumeMatches =
        volumeTitle.includes(normalized) ||
        (volume.name?.toLowerCase().includes(normalized) ?? false);

      const chapters = volume.chapters ?? [];
      if (volumeMatches) {
        return volume;
      }

      const matchingChapters = chapters.filter((chapter, index) =>
        chapterSearchText(chapter, volume, index).includes(normalized)
      );

      if (matchingChapters.length === 0) {
        return null;
      }

      return { ...volume, chapters: matchingChapters };
    })
    .filter((volume): volume is VolumeListItem => volume !== null);
}
