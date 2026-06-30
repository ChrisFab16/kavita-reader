/** Responsive grid metrics for browse screens (portrait + landscape). */

export const BROWSE_GRID_PADDING = 16;
export const BROWSE_GRID_GAP = 16;
export const BROWSE_CARD_INFO_HEIGHT = 96;
export const BROWSE_COVER_ASPECT = 1.5;

/** Column count from viewport width — more columns in landscape / tablets. */
export function getBrowseGridColumns(viewportWidth: number): number {
  if (viewportWidth >= 900) {
    return 5;
  }
  if (viewportWidth >= 700) {
    return 4;
  }
  if (viewportWidth >= 500) {
    return 3;
  }
  return 2;
}

export type BrowseGridMetrics = {
  columns: number;
  cardWidth: number;
  coverHeight: number;
  infoHeight: number;
  rowHeight: number;
  gap: number;
  padding: number;
};

export function getBrowseGridMetrics(viewportWidth: number): BrowseGridMetrics {
  const columns = getBrowseGridColumns(viewportWidth);
  const padding = BROWSE_GRID_PADDING;
  const gap = BROWSE_GRID_GAP;
  const contentWidth = Math.max(0, viewportWidth - padding * 2);
  const cardWidth = (contentWidth - gap * (columns - 1)) / columns;
  const coverHeight = cardWidth * BROWSE_COVER_ASPECT;
  const infoHeight = BROWSE_CARD_INFO_HEIGHT;
  const rowHeight = coverHeight + infoHeight + gap;

  return {
    columns,
    cardWidth,
    coverHeight,
    infoHeight,
    rowHeight,
    gap,
    padding,
  };
}

/** Home screen library cards — slightly tighter gap than series grid. */
export function getHomeCardWidth(viewportWidth: number, gap: number = 12): number {
  const columns = getBrowseGridColumns(viewportWidth);
  const padding = BROWSE_GRID_PADDING;
  const contentWidth = Math.max(0, viewportWidth - padding * 2);
  return (contentWidth - gap * (columns - 1)) / columns;
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

export function isLandscape(viewportWidth: number, viewportHeight: number): boolean {
  return viewportWidth > viewportHeight;
}
