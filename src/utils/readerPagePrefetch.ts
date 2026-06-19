import { Image } from 'expo-image';
import type { KavitaClient, PageImageAuthSource } from '../api/kavitaClient';
import type { ChapterInfoDto } from '../types/kavita';
import { isPdfChapter } from './readerChapter';
import { warmConcurrency, type PageWarmSettings } from './chapterPageAssets';

async function prefetchPageImage(source: PageImageAuthSource): Promise<void> {
  await Image.prefetch(source.uri, { headers: source.headers });
}

export async function warmChapterPages(
  client: KavitaClient,
  chapterId: number,
  chapterInfo: Pick<ChapterInfoDto, 'seriesFormat' | 'fileName'>,
  pageIndices: number[],
  settings: PageWarmSettings,
  signal?: AbortSignal
): Promise<void> {
  if (pageIndices.length === 0 || signal?.aborted) {
    return;
  }

  const extractPdf = isPdfChapter(chapterInfo);
  const sources: PageImageAuthSource[] = [];
  for (const page of pageIndices) {
    if (signal?.aborted) {
      return;
    }
    try {
      sources.push(client.getPageImageAuthSource(chapterId, page, { extractPdf }));
    } catch {
      // skip unauthenticated pages
    }
  }

  const concurrency = warmConcurrency(settings);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < sources.length) {
      if (signal?.aborted) {
        return;
      }
      const index = cursor;
      cursor += 1;
      try {
        await prefetchPageImage(sources[index]!);
      } catch {
        // best-effort warm
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, sources.length) }, () => worker())
  );
}

export function createReaderPrefetchRunner() {
  const controller = new AbortController();

  return {
    warm(
      client: KavitaClient,
      chapterId: number,
      chapterInfo: Pick<ChapterInfoDto, 'seriesFormat' | 'fileName'>,
      pageIndices: number[],
      settings: PageWarmSettings
    ) {
      return warmChapterPages(client, chapterId, chapterInfo, pageIndices, settings, controller.signal);
    },
    cancel() {
      controller.abort();
    },
  };
}
