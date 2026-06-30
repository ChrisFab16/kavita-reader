/**
 * Automated contract for browse grid layout (spec 013 FR-009).
 * Run via: npm run test:layout
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BROWSE_GRID_GAP,
  BROWSE_GRID_PADDING,
  BROWSE_LANDSCAPE_COLUMNS,
  BROWSE_MIN_COLUMNS,
  chunkIntoRows,
  getBrowseGridColumns,
  getBrowseGridMetrics,
  getHomeCardWidth,
  getLandscapeCardWidth,
  isLandscape,
} from './responsiveLayout';

type ViewportProfile = {
  id: string;
  width: number;
  height: number;
  expectColumns: number;
  note?: string;
};

type ViewportFixture = {
  profiles: ViewportProfile[];
};

const fixturePath = join(
  __dirname,
  '../../specs/013-landscape-interface/fixtures/browse-grid-viewports.json'
);
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8')) as ViewportFixture;

function innerContentWidth(viewportWidth: number): number {
  return Math.max(0, viewportWidth - BROWSE_GRID_PADDING * 2);
}

function rowContentWidth(columns: number, cardWidth: number, gap: number = BROWSE_GRID_GAP): number {
  return cardWidth * columns + gap * Math.max(0, columns - 1);
}

function metricsForBrowseScreen(width: number, height: number) {
  const inner = innerContentWidth(width);
  return getBrowseGridMetrics(width, height, inner);
}

describe('013 browse grid contract — viewport fixtures', () => {
  for (const profile of fixture.profiles) {
    it(`${profile.id}: ${profile.expectColumns} columns at ${profile.width}×${profile.height}`, () => {
      const inner = innerContentWidth(profile.width);
      const columns = getBrowseGridColumns(profile.width, profile.height, inner);
      assert.equal(
        columns,
        profile.expectColumns,
        `${profile.note ?? profile.id}: expected ${profile.expectColumns} columns, got ${columns}`
      );

      const metrics = metricsForBrowseScreen(profile.width, profile.height);
      assert.equal(metrics.columns, profile.expectColumns);

      const rowWidth = rowContentWidth(metrics.columns, metrics.cardWidth, metrics.gap);
      assert.ok(
        Math.abs(rowWidth - inner) < 0.02,
        `row width ${rowWidth} must match inner content ${inner}`
      );

      if (isLandscape(profile.width, profile.height)) {
        assert.equal(metrics.columns, BROWSE_LANDSCAPE_COLUMNS);
        assert.equal(
          metrics.cardWidth,
          getLandscapeCardWidth(inner, metrics.gap),
          'landscape card width must scale to fill five slots'
        );
      }
    });
  }
});

describe('013 browse grid contract — rules', () => {
  it('C3: landscape always uses 5 columns — covers scale, count does not', () => {
    for (const [width, height] of [
      [360, 200],
      [732, 360],
      [800, 400],
      [844, 390],
      [915, 400],
    ] as const) {
      const inner = innerContentWidth(width);
      assert.equal(getBrowseGridColumns(width, height, inner), BROWSE_LANDSCAPE_COLUMNS);
      const metrics = getBrowseGridMetrics(width, height, inner);
      assert.equal(metrics.cardWidth, getLandscapeCardWidth(inner, metrics.gap));
    }
  });

  it('R1: 732×360 landscape is 5 columns (not legacy 4-column breakpoint)', () => {
    const width = 732;
    const height = 360;
    const inner = innerContentWidth(width);
    assert.equal(getBrowseGridColumns(width, height, inner), 5);
    assert.notEqual(getBrowseGridColumns(width, height, inner), 4);
  });

  it('R2: narrow landscape keeps 5 columns with smaller cards', () => {
    const width = 360;
    const height = 200;
    const inner = innerContentWidth(width);
    assert.equal(getBrowseGridColumns(width, height, inner), 5);
    const metrics = getBrowseGridMetrics(width, height, inner);
    assert.ok(metrics.cardWidth < 72, 'covers scale down below portrait minimum');
  });

  it('C5: Home library cards use same column count and fit inner width', () => {
    const width = 844;
    const height = 390;
    const inner = innerContentWidth(width);
    const columns = getBrowseGridColumns(width, height, inner);
    const homeGap = 12;
    const cardWidth = getHomeCardWidth(width, homeGap, height, inner);
    const rowWidth = rowContentWidth(columns, cardWidth, homeGap);
    assert.ok(Math.abs(rowWidth - inner) < 0.02);
  });

  it('C7: chunkIntoRows uses 5 landscape slots per row', () => {
    const items = Array.from({ length: 12 }, (_, i) => i + 1);
    const rows = chunkIntoRows(items, BROWSE_LANDSCAPE_COLUMNS);
    assert.equal(rows.length, 3);
    assert.deepEqual(rows[0], [1, 2, 3, 4, 5]);
    for (const row of rows) {
      assert.ok(row.length <= BROWSE_LANDSCAPE_COLUMNS);
      assert.ok(row.length >= 1);
    }
  });

  it('C8: row slot width stays at column count width (partial rows do not expand)', () => {
    const width = 844;
    const height = 390;
    const inner = innerContentWidth(width);
    const metrics = getBrowseGridMetrics(width, height, inner);
    const fiveColWidth = getLandscapeCardWidth(inner, metrics.gap);
    assert.equal(metrics.cardWidth, fiveColWidth);
    const partialRowWidth = metrics.cardWidth * 4 + metrics.gap * 3;
    assert.ok(partialRowWidth < inner, 'four 5-col slots leave trailing space, not full-bleed four-up');
  });

  it('portrait never exceeds 3 columns', () => {
    for (const width of [390, 500, 600, 800]) {
      const columns = getBrowseGridColumns(width, 900, innerContentWidth(width));
      assert.ok(columns <= 3);
      assert.ok(columns >= BROWSE_MIN_COLUMNS);
    }
  });
});
