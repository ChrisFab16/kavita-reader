/** Volume/chapter shapes from GET /api/Series/volumes (subset used by UI). */
export interface VolumeChapterItem {
  id: number;
  range?: string;
  titleName?: string;
  fileName?: string;
  format?: number;
  pages?: number;
  pagesRead?: number;
}

export interface VolumeListItem {
  id: number;
  name?: string;
  minNumber?: number;
  chapters?: VolumeChapterItem[];
}

/** Kavita uses -100000 (and other negatives) for "whole volume = one archive" chapters. */
export function isVolumeArchiveChapter(chapter: VolumeChapterItem): boolean {
  const range = chapter.range?.trim() ?? '';
  if (!range) {
    return false;
  }
  if (range === '-100000') {
    return true;
  }
  const num = Number(range);
  return Number.isFinite(num) && num < 0;
}

export function isSingleVolumeArchive(volume: VolumeListItem): boolean {
  const chapters = volume.chapters ?? [];
  return chapters.length === 1 && isVolumeArchiveChapter(chapters[0]);
}

/**
 * Whether to hide the volume section header (cover + title row).
 * Numeric names like "1".."14" are normal for multi-volume manga — do not hide those.
 */
export function shouldHideVolumeHeader(
  volume: VolumeListItem,
  allVolumes: VolumeListItem[]
): boolean {
  const chapters = volume.chapters ?? [];
  const name = volume.name?.trim() ?? '';

  if (!name) {
    return true;
  }

  if (name.startsWith('-')) {
    return true;
  }

  if (name === '0' || volume.minNumber === 0) {
    return true;
  }

  const isNumericName = /^-?\d+$/.test(name);

  if (allVolumes.length > 1 && /^\d+$/.test(name)) {
    return false;
  }

  if (allVolumes.length === 1 && chapters.length === 1 && isNumericName) {
    return true;
  }

  return false;
}

/** User-facing volume title; numeric Kavita names become "Volume N". */
export function formatVolumeTitle(volume: VolumeListItem): string {
  const name = volume.name?.trim() ?? '';
  if (/^\d+$/.test(name)) {
    return `Volume ${name}`;
  }
  return name;
}

export function countSeriesVolumes(volumes: VolumeListItem[]): number {
  return volumes.filter((v) => !shouldHideVolumeHeader(v, volumes)).length;
}

export function countSeriesChapters(volumes: VolumeListItem[]): number {
  return volumes.reduce((sum, v) => sum + (v.chapters?.length ?? 0), 0);
}

/** Label for series header chip: prefer volume count when multiple volumes exist. */
export function formatSeriesStatsLabel(volumes: VolumeListItem[]): string {
  const volumeCount = volumes.length;
  const chapterCount = countSeriesChapters(volumes);

  if (volumeCount > 1) {
    return `${volumeCount} ${volumeCount === 1 ? 'Volume' : 'Volumes'}`;
  }

  return `${chapterCount} ${chapterCount === 1 ? 'Book' : 'Books'}`;
}

/** Ordered visible volume titles for regression checks (e.g. 14-volume manga). */
export function listVisibleVolumeTitles(volumes: VolumeListItem[]): string[] {
  return volumes
    .filter((v) => !shouldHideVolumeHeader(v, volumes))
    .map((v) => formatVolumeTitle(v));
}

/**
 * When true, the volume header is the only row (one CBZ/CBR per volume).
 * Avoids duplicate cover + "Chapter -100000" card below the header.
 */
export function shouldCollapseVolumeToHeader(
  volume: VolumeListItem,
  allVolumes: VolumeListItem[]
): boolean {
  return !shouldHideVolumeHeader(volume, allVolumes) && isSingleVolumeArchive(volume);
}

/** Chapter rows to render under a volume header (empty when collapsed). */
export function chaptersToRender(
  volume: VolumeListItem,
  allVolumes: VolumeListItem[]
): VolumeChapterItem[] {
  if (shouldCollapseVolumeToHeader(volume, allVolumes)) {
    return [];
  }
  return volume.chapters ?? [];
}

export function formatChapterTitle(
  chapter: VolumeChapterItem,
  volume: VolumeListItem,
  index: number
): string {
  if (isVolumeArchiveChapter(chapter)) {
    return formatVolumeTitle(volume);
  }

  if (chapter.titleName && chapter.titleName !== chapter.range) {
    return chapter.titleName;
  }

  const range = chapter.range?.trim() ?? '';
  if (range && range !== '0' && !isVolumeArchiveChapter(chapter)) {
    return `Chapter ${range}`;
  }

  if (chapter.fileName && typeof chapter.fileName === 'string') {
    const fileName = chapter.fileName.replace(/\.[^/.]+$/, '');
    if (fileName && fileName !== '0' && !/^\d+$/.test(fileName)) {
      return fileName;
    }
  }

  return `Book ${index + 1}`;
}
