import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BROWSE_LANDSCAPE_COLUMNS,
  BROWSE_MIN_CARD_WIDTH,
  chunkIntoRows,
  getBrowseGridColumns,
  getBrowseGridMetrics,
  getHomeCardWidth,
  getLandscapeCardWidth,
  isLandscape,
  maxColumnsForContentWidth,
} from './responsiveLayout';

describe('getBrowseGridColumns', () => {
  it('uses 2 columns on narrow portrait', () => {
    assert.equal(getBrowseGridColumns(390, 844), 2);
  });

  it('uses 3 columns on wide portrait', () => {
    assert.equal(getBrowseGridColumns(500, 900), 3);
  });

  it('always uses 5 columns in landscape regardless of width', () => {
    assert.equal(getBrowseGridColumns(800, 400), 5);
    assert.equal(getBrowseGridColumns(844, 390), 5);
    assert.equal(getBrowseGridColumns(732, 360), 5);
    assert.equal(getBrowseGridColumns(360, 200), 5);
  });
});

describe('getLandscapeCardWidth', () => {
  it('scales card width to fit five slots', () => {
    const inner = 768;
    assert.equal(getLandscapeCardWidth(inner), (768 - 64) / 5);
  });
});

describe('maxColumnsForContentWidth', () => {
  it('respects minimum card width (portrait helper)', () => {
    assert.equal(maxColumnsForContentWidth(768), 8);
    assert.equal(maxColumnsForContentWidth(200), 2);
  });
});

describe('getBrowseGridMetrics', () => {
  it('fits cards within viewport with gaps (portrait)', () => {
    const width = 400;
    const metrics = getBrowseGridMetrics(width, 800);
    const total =
      metrics.padding * 2 +
      metrics.cardWidth * metrics.columns +
      metrics.gap * (metrics.columns - 1);
    assert.equal(Math.round(total), width);
    assert.equal(metrics.columns, 2);
  });

  it('fits five landscape columns by scaling card width', () => {
    const width = 800;
    const metrics = getBrowseGridMetrics(width, 400);
    assert.equal(metrics.columns, BROWSE_LANDSCAPE_COLUMNS);
    const inner = width - 32;
    assert.equal(metrics.cardWidth, getLandscapeCardWidth(inner, metrics.gap));
    const rowWidth = metrics.cardWidth * 5 + metrics.gap * 4;
    assert.equal(Math.round(rowWidth), inner);
  });

  it('scales down covers on narrow landscape but keeps 5 columns', () => {
    const metrics = getBrowseGridMetrics(360, 200);
    assert.equal(metrics.columns, 5);
    assert.ok(metrics.cardWidth < BROWSE_MIN_CARD_WIDTH);
  });

  it('uses compact overlay cards in landscape (no info block below cover)', () => {
    const landscape = getBrowseGridMetrics(844, 390);
    assert.equal(landscape.compactCard, true);
    assert.equal(landscape.infoHeight, 0);
    assert.equal(landscape.rowHeight, landscape.coverHeight + landscape.gap);

    const portrait = getBrowseGridMetrics(390, 844);
    assert.equal(portrait.compactCard, false);
    assert.ok(portrait.infoHeight > 0);
  });
});

describe('chunkIntoRows', () => {
  it('chunks by column count', () => {
    assert.deepEqual(chunkIntoRows([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
    assert.deepEqual(chunkIntoRows([1, 2, 3], 3), [[1, 2, 3]]);
  });
});

describe('getHomeCardWidth', () => {
  it('matches grid column math with home gap', () => {
    const width = 800;
    const height = 400;
    const columns = getBrowseGridColumns(width, height);
    const cardWidth = getHomeCardWidth(width, 12, height);
    const total = 32 + cardWidth * columns + 12 * (columns - 1);
    assert.equal(Math.round(total), width);
  });
});

describe('isLandscape', () => {
  it('detects orientation from dimensions', () => {
    assert.equal(isLandscape(800, 400), true);
    assert.equal(isLandscape(400, 800), false);
  });
});
