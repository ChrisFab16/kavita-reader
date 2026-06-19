import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  autoFitMode,
  computeDisplaySize,
  computeFitScale,
  clampPanTranslation,
} from './readerFit';
import { isPdfChapter, getPageDimensionsFromChapter } from './readerChapter';
import { MangaFormat } from '../types/kavita';
import type { ChapterInfoDto } from '../types/kavita';

describe('autoFitMode', () => {
  it('uses fitWidth in landscape', () => {
    assert.equal(autoFitMode(800, 400), 'fitWidth');
  });

  it('uses fitScreen in portrait', () => {
    assert.equal(autoFitMode(400, 800), 'fitScreen');
  });
});

describe('computeFitScale', () => {
  const image = { width: 1000, height: 1500 };
  const portrait = { width: 400, height: 800 };
  const landscape = { width: 800, height: 400 };

  it('fitScreen uses the smaller axis scale in portrait', () => {
    assert.equal(
      computeFitScale(image.width, image.height, portrait.width, portrait.height, 'fitScreen'),
      0.4
    );
  });

  it('fitWidth fills viewport width in landscape', () => {
    assert.equal(
      computeFitScale(image.width, image.height, landscape.width, landscape.height, 'fitWidth'),
      0.8
    );
  });

  it('fitHeight fills viewport height', () => {
    assert.equal(
      computeFitScale(image.width, image.height, portrait.width, portrait.height, 'fitHeight'),
      portrait.height / image.height
    );
  });
});

describe('computeDisplaySize', () => {
  it('matches scale times native dimensions', () => {
    const size = computeDisplaySize(1000, 2000, 500, 1000, 'fitWidth');
    assert.equal(size.width, 500);
    assert.equal(size.height, 1000);
  });
});

describe('isPdfChapter', () => {
  it('detects seriesFormat PDF', () => {
    assert.equal(
      isPdfChapter({ seriesFormat: MangaFormat.Pdf, fileName: 'book.cbz' }),
      true
    );
  });

  it('detects .pdf fileName', () => {
    assert.equal(
      isPdfChapter({ seriesFormat: MangaFormat.Archive, fileName: 'issue.pdf' }),
      true
    );
  });

  it('returns false for archives', () => {
    assert.equal(
      isPdfChapter({ seriesFormat: MangaFormat.Archive, fileName: 'issue.cbz' }),
      false
    );
  });
});

describe('clampPanTranslation', () => {
  it('clamps to zero when content fits the viewport', () => {
    assert.deepEqual(
      clampPanTranslation(1000, 1500, 400, 800, 'fitScreen', 1, 50, 50),
      { x: 0, y: 0 }
    );
  });

  it('allows vertical pan when zoomed past viewport height', () => {
    const result = clampPanTranslation(1000, 1500, 400, 800, 'fitScreen', 2, 0, 120);
    assert.equal(result.x, 0);
    assert.equal(result.y, 120);
  });
});

describe('getPageDimensionsFromChapter', () => {
  const chapter: ChapterInfoDto = {
    chapterNumber: '1',
    volumeNumber: '1',
    volumeId: 1,
    seriesName: 'S',
    seriesId: 2,
    libraryId: 3,
    title: 'T',
    pages: 2,
    seriesFormat: MangaFormat.Pdf,
    pageDimensions: [
      { pageNumber: 0, width: 1200, height: 1800 },
      { pageNumber: 1, width: 1200, height: 1600 },
    ],
  };

  it('finds dimensions by pageNumber', () => {
    assert.deepEqual(getPageDimensionsFromChapter(chapter, 1), {
      width: 1200,
      height: 1600,
    });
  });
});
