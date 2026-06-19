export type ReaderFitMode = 'fitScreen' | 'fitWidth' | 'fitHeight';

export type Size = { width: number; height: number };

/** Default fit: portrait → fit screen; landscape → fit width. */
export function autoFitMode(viewportWidth: number, viewportHeight: number): ReaderFitMode {
  return viewportWidth > viewportHeight ? 'fitWidth' : 'fitScreen';
}

export type FitModePreference = 'auto' | ReaderFitMode;

export function resolveReaderFitMode(
  preference: FitModePreference,
  viewportWidth: number,
  viewportHeight: number
): ReaderFitMode {
  if (preference !== 'auto') {
    return preference;
  }
  return autoFitMode(viewportWidth, viewportHeight);
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
  'worklet';
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

export const MAX_ZOOM_SCALE = 4;

/** Toggle target: fit (1) ↔ 2× fit (Q4 portrait; 2× fit-width when landscape default is already fit-width). */
export function getToggleZoomScale(currentScale: number): number {
  'worklet';
  return currentScale > 1.01 ? 1 : 2;
}

export function clampPanTranslation(
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  mode: ReaderFitMode,
  userScale: number,
  translateX: number,
  translateY: number
): { x: number; y: number } {
  'worklet';
  const fitScale = computeFitScale(imageWidth, imageHeight, viewportWidth, viewportHeight, mode);
  const displayedW = imageWidth * fitScale * userScale;
  const displayedH = imageHeight * fitScale * userScale;
  const maxTx = Math.max(0, (displayedW - viewportWidth) / 2);
  const maxTy = Math.max(0, (displayedH - viewportHeight) / 2);
  return {
    x: Math.min(maxTx, Math.max(-maxTx, translateX)),
    y: Math.min(maxTy, Math.max(-maxTy, translateY)),
  };
}
