import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildProgressPayload,
  validateProgressPayload,
  ProgressPayloadError,
} from './readingProgress';
import { normalizeChapterInfo, normalizeContinuePointChapter, normalizeProgressDto } from './kavitaDto';
import type { ChapterInfoDto } from '../types/kavita';
import { MangaFormat } from '../types/kavita';

const chapterInfo: ChapterInfoDto = {
  chapterNumber: '1',
  volumeNumber: '1',
  volumeId: 10,
  seriesName: 'Test Series',
  seriesId: 20,
  libraryId: 3,
  title: 'Test Series',
  pages: 100,
  seriesFormat: MangaFormat.Archive,
};

describe('buildProgressPayload', () => {
  it('includes libraryId and 0-based pageNum', () => {
    assert.deepEqual(
      buildProgressPayload(chapterInfo, 99, 4, { seriesIdFallback: 0 }),
      {
        seriesId: 20,
        volumeId: 10,
        chapterId: 99,
        pageNum: 4,
        libraryId: 3,
      }
    );
  });

  it('falls back to route and progress hints when chapter-info ids are missing', () => {
    const payload = buildProgressPayload(
      { ...chapterInfo, seriesId: 0, volumeId: 0, libraryId: 0 },
      99,
      2,
      {
        seriesIdFallback: 55,
        volumeIdFallback: 77,
        libraryIdFallback: 9,
        progressHint: {
          seriesId: 0,
          volumeId: 0,
          chapterId: 99,
          pageNum: 1,
          libraryId: 0,
        },
      }
    );
    assert.deepEqual(payload, {
      seriesId: 55,
      volumeId: 77,
      chapterId: 99,
      pageNum: 2,
      libraryId: 9,
    });
  });
});

describe('validateProgressPayload', () => {
  it('throws when libraryId is missing', () => {
    assert.throws(
      () =>
        validateProgressPayload({
          seriesId: 1,
          volumeId: 2,
          chapterId: 3,
          pageNum: 4,
          libraryId: 0,
        }),
      ProgressPayloadError
    );
  });
});

describe('normalizeChapterInfo', () => {
  it('reads PascalCase ids from Kavita JSON', () => {
    const normalized = normalizeChapterInfo({
      SeriesId: 20,
      VolumeId: 10,
      LibraryId: 3,
      Pages: 50,
      Title: 'Chapter',
      SeriesName: 'Series',
      ChapterNumber: '1',
      VolumeNumber: '1',
      SeriesFormat: 1,
    });
    assert.equal(normalized.seriesId, 20);
    assert.equal(normalized.volumeId, 10);
    assert.equal(normalized.libraryId, 3);
    assert.equal(normalized.pages, 50);
  });
});

describe('normalizeProgressDto', () => {
  it('reads PascalCase pageNum', () => {
    const normalized = normalizeProgressDto({
      ChapterId: 99,
      PageNum: 7,
      SeriesId: 1,
      VolumeId: 2,
      LibraryId: 3,
    });
    assert.equal(normalized.pageNum, 7);
    assert.equal(normalized.chapterId, 99);
  });
});

describe('normalizeContinuePointChapter', () => {
  it('reads chapter ids for continue-point', () => {
    const normalized = normalizeContinuePointChapter({
      Id: 789,
      VolumeId: 456,
      SeriesId: 123,
      FileName: 'vol01.cbz',
      Format: 1,
    });
    assert.equal(normalized.id, 789);
    assert.equal(normalized.volumeId, 456);
    assert.equal(normalized.seriesId, 123);
    assert.equal(normalized.fileName, 'vol01.cbz');
    assert.equal(normalized.format, 1);
  });
});
