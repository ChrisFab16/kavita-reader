import RNBlobUtil from 'react-native-blob-util';
import type { KavitaClient } from '../api/kavitaClient';
import type { ChapterInfoDto } from '../types/kavita';
import { offlinePageFileName, warmConcurrency, type PageWarmSettings } from '../utils/chapterPageAssets';
import { isPdfChapter } from '../utils/readerChapter';

const OFFLINE_ROOT = 'kavita-offline';

export type OfflineChapterManifest = {
  serverId: string;
  chapterId: number;
  seriesId: number;
  totalPages: number;
  downloadedAt: string;
  format: 'pages';
};

function chapterDir(serverId: string, chapterId: number): string {
  return `${RNBlobUtil.fs.dirs.DocumentDir}/${OFFLINE_ROOT}/${serverId}/${chapterId}`;
}

function manifestPath(serverId: string, chapterId: number): string {
  return `${chapterDir(serverId, chapterId)}/manifest.json`;
}

function pagePath(serverId: string, chapterId: number, pageIndex: number): string {
  return `${chapterDir(serverId, chapterId)}/${offlinePageFileName(pageIndex)}`;
}

export async function resolveOfflinePageUri(
  serverId: string,
  chapterId: number,
  pageIndex: number
): Promise<string | null> {
  const path = pagePath(serverId, chapterId, pageIndex);
  const exists = await RNBlobUtil.fs.exists(path);
  if (!exists) {
    return null;
  }
  return `file://${path}`;
}

export async function isChapterFullyDownloaded(
  serverId: string,
  chapterId: number,
  totalPages: number
): Promise<boolean> {
  if (totalPages <= 0) {
    return false;
  }
  const manifestExists = await RNBlobUtil.fs.exists(manifestPath(serverId, chapterId));
  if (!manifestExists) {
    return false;
  }
  for (let page = 0; page < totalPages; page += 1) {
    const exists = await RNBlobUtil.fs.exists(pagePath(serverId, chapterId, page));
    if (!exists) {
      return false;
    }
  }
  return true;
}

export async function removeOfflineChapter(serverId: string, chapterId: number): Promise<void> {
  const dir = chapterDir(serverId, chapterId);
  const exists = await RNBlobUtil.fs.exists(dir);
  if (exists) {
    await RNBlobUtil.fs.unlink(dir);
  }
}

export type DownloadChapterProgress = {
  completedPages: number;
  totalPages: number;
};

/** Durable page download — same URLs as reader prefetch (012 P1 image/PDF/archive). */
export async function downloadChapterPages(
  client: KavitaClient,
  serverId: string,
  seriesId: number,
  chapterId: number,
  chapterInfo: ChapterInfoDto,
  onProgress?: (progress: DownloadChapterProgress) => void,
  signal?: AbortSignal
): Promise<void> {
  const totalPages = chapterInfo.pages ?? 0;
  if (totalPages <= 0) {
    throw new Error('Chapter has no pages to download');
  }

  const dir = chapterDir(serverId, chapterId);
  await RNBlobUtil.fs.mkdir(dir);

  const extractPdf = isPdfChapter(chapterInfo);
  const headers = client.getAuthHeaders();
  const settings: PageWarmSettings = { prefetchPages: 0, cacheEntireAlbum: true };
  const concurrency = warmConcurrency(settings);
  const pageIndices = Array.from({ length: totalPages }, (_, i) => i);
  let completed = 0;
  let cursor = 0;

  async function downloadPage(pageIndex: number): Promise<void> {
    if (signal?.aborted) {
      throw new Error('Download cancelled');
    }
    const url = client.getPageImageUrl(chapterId, pageIndex, { extractPdf });
    const dest = pagePath(serverId, chapterId, pageIndex);
    const exists = await RNBlobUtil.fs.exists(dest);
    if (!exists) {
      await RNBlobUtil.config({ path: dest }).fetch('GET', url, headers);
    }
    completed += 1;
    onProgress?.({ completedPages: completed, totalPages });
  }

  async function worker(): Promise<void> {
    while (cursor < pageIndices.length) {
      if (signal?.aborted) {
        throw new Error('Download cancelled');
      }
      const pageIndex = pageIndices[cursor]!;
      cursor += 1;
      await downloadPage(pageIndex);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, pageIndices.length) }, () => worker())
  );

  const manifest: OfflineChapterManifest = {
    serverId,
    chapterId,
    seriesId,
    totalPages,
    downloadedAt: new Date().toISOString(),
    format: 'pages',
  };
  await RNBlobUtil.fs.writeFile(
    manifestPath(serverId, chapterId),
    JSON.stringify(manifest),
    'utf8'
  );
}
