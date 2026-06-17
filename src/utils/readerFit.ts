export type ReaderFitMode = 'fitScreen' | 'fitWidth' | 'fitHeight';

export type Size = { width: number; height: number };

/** Default fit: portrait → fit screen; landscape → fit width. */
export function autoFitMode(viewportWidth: number, viewportHeight: number): ReaderFitMode {
  return viewportWidth > viewportHeight ? 'fitWidth' : 'fitScreen';
}

/**
 * Scale factor applied to native image pixels so the page fits the viewport per mode.
 * Multiply image width/height by this value for display dimensions.
 */
export function computeFitScale(
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  mode: ReaderFitMode
): number {
  if (imageWidth <= 0 || imageHeight <= 0 || viewportWidth <= 0 || viewportHeight <= 0) {
    return 1;
  }

  switch (mode) {
    case 'fitWidth':
      return viewportWidth / imageWidth;
    case 'fitHeight':
      return viewportHeight / imageHeight;
    case 'fitScreen':
    default:
      return Math.min(viewportWidth / imageWidth, viewportHeight / imageHeight);
  }
}

/** Display size in density-independent pixels for expo-image layout. */
export function computeDisplaySize(
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  mode: ReaderFitMode
): Size {
  const scale = computeFitScale(
    imageWidth,
    imageHeight,
    viewportWidth,
    viewportHeight,
    mode
  );
  return {
    width: imageWidth * scale,
    height: imageHeight * scale,
  };
}
