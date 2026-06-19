/** Tap-zone and pinch helpers for the image reader (pure logic — unit-tested). */

export const EDGE_ZONE_RATIO = 0.2;
export const DOUBLE_TAP_DELAY_MS = 300;
export const ZOOMED_EPSILON = 1.01;

export type TapZone = 'left' | 'center' | 'right';

export type TapAction =
  | 'previous-page'
  | 'next-page'
  | 'toggle-chrome'
  | 'toggle-zoom'
  | 'none';

export type TapContext = {
  x: number;
  viewportWidth: number;
  isZoomed: boolean;
  chromeVisible: boolean;
  edgeRatio?: number;
};

export function getTapZone(
  x: number,
  viewportWidth: number,
  edgeRatio: number = EDGE_ZONE_RATIO
): TapZone {
  if (viewportWidth <= 0) {
    return 'center';
  }
  const edge = viewportWidth * edgeRatio;
  if (x < edge) {
    return 'left';
  }
  if (x > viewportWidth - edge) {
    return 'right';
  }
  return 'center';
}

/** Maps a tap to the action the reader should take (spec FR-005). */
export function resolveTapAction(ctx: TapContext): TapAction {
  const zone = getTapZone(ctx.x, ctx.viewportWidth, ctx.edgeRatio);

  if (ctx.chromeVisible) {
    return 'toggle-chrome';
  }

  if (ctx.isZoomed) {
    switch (zone) {
      case 'left':
        return 'previous-page';
      case 'right':
        return 'next-page';
      case 'center':
      default:
        return 'none';
    }
  }

  switch (zone) {
    case 'left':
      return 'previous-page';
    case 'right':
      return 'next-page';
    case 'center':
    default:
      return 'toggle-chrome';
  }
}

export function getEdgeZoneWidths(
  viewportWidth: number,
  edgeRatio: number = EDGE_ZONE_RATIO
): { leftWidth: number; rightWidth: number } {
  const edge = viewportWidth * edgeRatio;
  return { leftWidth: edge, rightWidth: edge };
}

export function clampPinchScale(
  startScale: number,
  pinchFactor: number,
  maxScale: number
): number {
  return Math.min(maxScale, Math.max(1, startScale * pinchFactor));
}

export function normalizeZoomScale(scale: number, maxScale: number): number {
  return scale <= ZOOMED_EPSILON ? 1 : Math.min(maxScale, scale);
}

/** Pressable-friendly double-tap detector (works with mouse clicks on emulator). */
export function createDoubleTapPressHandler(options: {
  onSingle: () => void;
  onDouble: () => void;
  delayMs?: number;
  now?: () => number;
  schedule?: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
  cancel?: (id: ReturnType<typeof setTimeout>) => void;
}): () => void {
  const delay = options.delayMs ?? DOUBLE_TAP_DELAY_MS;
  const now = options.now ?? (() => Date.now());
  const schedule = options.schedule ?? ((fn, ms) => setTimeout(fn, ms));
  const cancel = options.cancel ?? clearTimeout;

  let lastTapAt = 0;
  let pendingTimer: ReturnType<typeof setTimeout> | null = null;

  return () => {
    const ts = now();
    if (pendingTimer !== null && ts - lastTapAt <= delay) {
      cancel(pendingTimer);
      pendingTimer = null;
      lastTapAt = 0;
      options.onDouble();
      return;
    }

    lastTapAt = ts;
    if (pendingTimer) {
      cancel(pendingTimer);
    }
    pendingTimer = schedule(() => {
      pendingTimer = null;
      lastTapAt = 0;
      options.onSingle();
    }, delay);
  };
}
