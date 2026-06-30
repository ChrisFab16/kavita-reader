import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BROWSE_GRID_PADDING,
  getBrowseGridMetrics,
  getHomeCardWidth,
  type BrowseGridMetrics,
} from '../utils/responsiveLayout';

type Options = {
  /** Horizontal padding already applied by parent section (each side). Default 16. */
  sectionPadding?: number;
  /** When true, subtract sectionPadding×2 from onLayout width (probe on padded section). */
  measureIncludesSectionPadding?: boolean;
};

/**
 * Browse grid metrics sized to the actual content box (safe area + section padding),
 * refined via onLayout when the grid container mounts or resizes.
 */
export function useBrowseGridLayout(
  windowWidth: number,
  windowHeight: number,
  options?: Options
) {
  const insets = useSafeAreaInsets();
  const sectionPad = options?.sectionPadding ?? BROWSE_GRID_PADDING;
  const subtractSectionPadding = options?.measureIncludesSectionPadding === true;

  const estimatedInnerWidth = Math.max(
    0,
    windowWidth - insets.left - insets.right - sectionPad * 2
  );

  const [measuredInnerWidth, setMeasuredInnerWidth] = useState<number | null>(null);

  useEffect(() => {
    setMeasuredInnerWidth(null);
  }, [windowWidth, windowHeight]);

  const innerContentWidth = measuredInnerWidth ?? estimatedInnerWidth;

  const gridMetrics = useMemo(
    () => getBrowseGridMetrics(windowWidth, windowHeight, innerContentWidth),
    [windowWidth, windowHeight, innerContentWidth]
  );

  const libraryCardWidth = useMemo(
    () => getHomeCardWidth(windowWidth, 12, windowHeight, innerContentWidth),
    [windowWidth, windowHeight, innerContentWidth]
  );

  const onGridLayout = useCallback((event: LayoutChangeEvent) => {
    let width = event.nativeEvent.layout.width;
    if (width <= 0) {
      return;
    }
    if (subtractSectionPadding) {
      width = Math.max(0, width - sectionPad * 2);
    }
    setMeasuredInnerWidth((prev) => (prev != null && Math.abs(prev - width) < 0.5 ? prev : width));
  }, [sectionPad, subtractSectionPadding]);

  return {
    gridMetrics,
    libraryCardWidth,
    onGridLayout,
    innerContentWidth,
  } satisfies {
    gridMetrics: BrowseGridMetrics;
    libraryCardWidth: number;
    onGridLayout: (event: LayoutChangeEvent) => void;
    innerContentWidth: number;
  };
}
