import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  chunkIntoRows,
  getBrowseGridColumns,
  getBrowseGridMetrics,
  getHomeCardWidth,
  isLandscape,
} from './responsiveLayout';

describe('getBrowseGridColumns', () => {
  it('uses 2 columns on narrow portrait', () => {
    assert.equal(getBrowseGridColumns(390), 2);
  });

  it('uses 3 columns from 500px', () => {
    assert.equal(getBrowseGridColumns(500), 3);
    assert.equal(getBrowseGridColumns(800), 4);
  });

  it('uses 5 columns on wide tablets', () => {
    assert.equal(getBrowseGridColumns(1024), 5);
  });
});

describe('getBrowseGridMetrics', () => {
  it('fits cards within viewport with gaps', () => {
    const width = 400;
    const metrics = getBrowseGridMetrics(width);
    const total =
      metrics.padding * 2 +
      metrics.cardWidth * metrics.columns +
      metrics.gap * (metrics.columns - 1);
    assert.equal(Math.round(total), width);
    assert.equal(metrics.columns, 2);
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
    const columns = getBrowseGridColumns(width);
    const cardWidth = getHomeCardWidth(width, 12);
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
