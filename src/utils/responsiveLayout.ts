/** Responsive grid metrics for browse screens (portrait + landscape). */

export const BROWSE_GRID_PADDING = 16;
export const BROWSE_GRID_GAP = 16;
export const BROWSE_CARD_INFO_HEIGHT = 96;
export const BROWSE_COVER_ASPECT = 1.5;
/** Portrait column floor — not applied to landscape scaling. */
export const BROWSE_MIN_CARD_WIDTH = 72;
export const BROWSE_MIN_COLUMNS = 2;
/** Landscape always lays out this many covers per row; card width scales down to fit. */
export const BROWSE_LANDSCAPE_COLUMNS = 5;
/** @deprecated Use {@link BROWSE_LANDSCAPE_COLUMNS} — landscape is a fixed column count, not a cap. */
export const BROWSE_MAX_COLUMNS_LANDSCAPE = BROWSE_LANDSCAPE_COLUMNS;
export const BROWSE_MAX_COLUMNS_PORTRAIT = 3;

export function isLandscape(viewportWidth: number, viewportHeight: number): boolean {
  return viewportWidth > viewportHeight;
}

function contentWidth(viewportWidth: number): number {
  return Math.max(0, viewportWidth - BROWSE_GRID_PADDING * 2);
}

/** Card width when landscape row uses {@link BROWSE_LANDSCAPE_COLUMNS} slots. */
export function getLandscapeCardWidth(
  innerContentWidth: number,
  gap: number = BROWSE_GRID_GAP
): number {
  return (innerContentWidth - gap * (BROWSE_LANDSCAPE_COLUMNS - 1)) / BROWSE_LANDSCAPE_COLUMNS;
}

/** How many columns fit at minimum card width (portrait helpers / tests only). */
export function maxColumnsForContentWidth(contentW: number, gap: number = BROWSE_GRID_GAP): number {
  if (contentW <= 0) {
    return BROWSE_MIN_COLUMNS;
  }
  return Math.floor((contentW + gap) / (BROWSE_MIN_CARD_WIDTH + gap));
}

/**
 * Column count from viewport — portrait uses width steps; landscape always
 * {@link BROWSE_LANDSCAPE_COLUMNS} with cover width scaled to fit the row.
 */
export function getBrowseGridColumns(
  viewportWidth: number,
  viewportHeight?: number,
  _innerContentWidth?: number
): number {
  const landscape =
    viewportHeight != null ? isLandscape(viewportWidth, viewportHeight) : viewportWidth > viewportHeight;

  if (landscape) {
    return BROWSE_LANDSCAPE_COLUMNS;
  }

  if (viewportWidth >= 500) {
    return BROWSE_MAX_COLUMNS_PORTRAIT;
  }
  return BROWSE_MIN_COLUMNS;
}

export type BrowseGridMetrics = {
  columns: number;
  cardWidth: number;
  coverHeight: number;
  infoHeight: number;
  rowHeight: number;
  gap: number;
  padding: number;
  /** Landscape 5-up uses title overlay on cover instead of a block below. */
  compactCard: boolean;
};

export function getBrowseGridMetrics(
  viewportWidth: number,
  viewportHeight?: number,
  innerContentWidth?: number
): BrowseGridMetrics {
  const innerWidth = innerContentWidth ?? contentWidth(viewportWidth);
  const landscape =
    viewportHeight != null ? isLandscape(viewportWidth, viewportHeight) : viewportWidth > viewportHeight;
  const columns = getBrowseGridColumns(viewportWidth, viewportHeight, innerWidth);
  const padding = BROWSE_GRID_PADDING;
  const gap = BROWSE_GRID_GAP;
  const cardWidth = (innerWidth - gap * (columns - 1)) / columns;
  const coverHeight = cardWidth * BROWSE_COVER_ASPECT;
  const compactCard = landscape;
  const infoHeight = compactCard ? 0 : BROWSE_CARD_INFO_HEIGHT;
  const rowHeight = coverHeight + infoHeight + gap;

  return {
    columns,
    cardWidth,
    coverHeight,
    infoHeight,
    rowHeight,
    gap,
    padding,
    compactCard,
  };
}

/** Home screen library cards — slightly tighter gap than series grid. */
export function getHomeCardWidth(
  viewportWidth: number,
  gap: number = 12,
  viewportHeight?: number,
  innerContentWidth?: number
): number {
  const innerWidth = innerContentWidth ?? contentWidth(viewportWidth);
  const columns = getBrowseGridColumns(viewportWidth, viewportHeight, innerWidth);
  return (innerWidth - gap * (columns - 1)) / columns;
}

export function chunkIntoRows<T>(items: T[], columns: number): T[][] {
  if (columns <= 0) {
    return [];
  }
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }
  return rows;
}
