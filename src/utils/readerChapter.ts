import type { ChapterInfoDto } from '../types/kavita';
import { MangaFormat } from '../types/kavita';

export function isPdfChapter(
  info: Pick<ChapterInfoDto, 'seriesFormat' | 'fileName'>
): boolean {
  if (info.seriesFormat === MangaFormat.Pdf) {
    return true;
  }
  const name = info.fileName?.toLowerCase() ?? '';
  return name.endsWith('.pdf');
}

export function getPageDimensionsFromChapter(
  chapterInfo: ChapterInfoDto,
  pageIndex: number
): { width: number; height: number } | null {
  const dims = chapterInfo.pageDimensions;
  if (!dims?.length) {
    return null;
  }
  const byNumber = dims.find((d) => d.pageNumber === pageIndex);
  if (byNumber && byNumber.width > 0 && byNumber.height > 0) {
    return { width: byNumber.width, height: byNumber.height };
  }
  const byIndex = dims[pageIndex];
  if (byIndex && byIndex.width > 0 && byIndex.height > 0) {
    return { width: byIndex.width, height: byIndex.height };
  }
  return null;
}
