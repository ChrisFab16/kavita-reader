import { KavitaClient } from '../api/kavitaClient';

export type ReaderKind = 'epub' | 'image';

export type ChapterReaderHint = {
  format?: number;
  fileName?: string;
};

/** Kavita MangaFormat: 0 Unknown, 1 Archive, 2 Epub, 3 Pdf, 4 Image */
export function readerKindFromChapterMeta(meta: ChapterReaderHint): ReaderKind | null {
  if (meta.format === 2) return 'epub';
  if (meta.format === 3 || meta.format === 1 || meta.format === 4) return 'image';

  const fileName = meta.fileName?.toLowerCase() ?? '';
  if (fileName.endsWith('.epub')) return 'epub';
  if (fileName.length > 0) return 'image';

  return null;
}

/**
 * Resolve which reader to mount. Prefer chapter metadata from SeriesDetail;
 * fall back to Reader/chapter-info, then Book/book-info for EPUB-only chapters.
 */
export async function detectReaderKind(
  client: KavitaClient,
  chapterId: number,
  hint?: ChapterReaderHint
): Promise<ReaderKind> {
  const hinted = hint ? readerKindFromChapterMeta(hint) : null;
  if (hinted) return hinted;

  try {
    const info = await client.getChapterInfo(chapterId);
    const fromInfo = readerKindFromChapterMeta({
      format: info.seriesFormat ?? info.format,
      fileName: info.fileName,
    });
    if (fromInfo) return fromInfo;
    return info.fileName?.toLowerCase().endsWith('.epub') ? 'epub' : 'image';
  } catch {
    // Some EPUB chapters do not expose Reader/chapter-info — try Book API.
  }

  try {
    await client.getBookInfo(chapterId);
    return 'epub';
  } catch {
    return 'image';
  }
}
