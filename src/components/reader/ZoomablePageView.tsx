import React, { useCallback, useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import {
  MAX_ZOOM_SCALE,
  computeFitScale,
  getToggleZoomScale,
  type ReaderFitMode,
} from '../../utils/readerFit';
import {
  DOUBLE_TAP_DELAY_MS,
  createDoubleTapPressHandler,
  getEdgeZoneWidths,
  getTapZone,
  ZOOMED_EPSILON,
} from '../../utils/readerGestures';

type Props = {
  viewportWidth: number;
  viewportHeight: number;
  imageWidth: number;
  imageHeight: number;
  fitMode: ReaderFitMode;
  zoomScale: number;
  panResetKey: number;
  chromeVisible: boolean;
  onZoomScaleChange: (scale: number) => void;
  onZoomedChange?: (isZoomed: boolean) => void;
  onCenterTap?: () => void;
  onTapLeft?: () => void;
  onTapRight?: () => void;
  children: React.ReactNode;
};

export default function ZoomablePageView({
  viewportWidth,
  viewportHeight,
  imageWidth,
  imageHeight,
  fitMode,
  zoomScale,
  panResetKey,
  chromeVisible,
  onZoomScaleChange,
  onZoomedChange,
  onCenterTap,
  onTapLeft,
  onTapRight,
  children,
}: Props) {
  const baseWidth = useMemo(
    () => imageWidth * computeFitScale(imageWidth, imageHeight, viewportWidth, viewportHeight, fitMode),
    [imageWidth, imageHeight, viewportWidth, viewportHeight, fitMode]
  );
  const baseHeight = useMemo(
    () => imageHeight * computeFitScale(imageWidth, imageHeight, viewportWidth, viewportHeight, fitMode),
    [imageWidth, imageHeight, viewportWidth, viewportHeight, fitMode]
  );

  const scaledWidth = baseWidth * zoomScale;
  const scaledHeight = baseHeight * zoomScale;
  /** Content exceeds viewport — needs pan (includes fit-width landscape letterboxing). */
  const needsPan = scaledWidth > viewportWidth + 1 || scaledHeight > viewportHeight + 1;
  /** User has zoomed past fit scale — toggles zoom-out and chrome peek. */
  const isUserZoomed = zoomScale > ZOOMED_EPSILON;
  const { leftWidth, rightWidth } = getEdgeZoneWidths(viewportWidth);

  const zoomScaleSv = useSharedValue(zoomScale);
  const pinchStartScale = useSharedValue(zoomScale);
  const pinchLiveScale = useSharedValue(zoomScale);
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  const panStartX = useSharedValue(0);
  const panStartY = useSharedValue(0);
  const maxPanXSv = useSharedValue(0);
  const maxPanYSv = useSharedValue(0);

  useEffect(() => {
    zoomScaleSv.value = zoomScale;
    pinchStartScale.value = zoomScale;
    pinchLiveScale.value = zoomScale;
  }, [zoomScale, zoomScaleSv, pinchStartScale, pinchLiveScale]);

  useEffect(() => {
    if (!needsPan) {
      return;
    }
    const maxX = Math.max(0, scaledWidth - viewportWidth);
    const maxY = Math.max(0, scaledHeight - viewportHeight);
    maxPanXSv.value = maxX;
    maxPanYSv.value = maxY;
    panX.value = maxX / 2;
    panY.value = maxY / 2;
  }, [
    panResetKey,
    zoomScale,
    needsPan,
    scaledWidth,
    scaledHeight,
    viewportWidth,
    viewportHeight,
    maxPanXSv,
    maxPanYSv,
    panX,
    panY,
  ]);

  const publishScale = useCallback(
    (next: number) => {
      const normalized = next <= ZOOMED_EPSILON ? 1 : Math.min(MAX_ZOOM_SCALE, next);
      onZoomScaleChange(normalized);
      onZoomedChange?.(normalized > ZOOMED_EPSILON);
    },
    [onZoomScaleChange, onZoomedChange]
  );

  const zoomToToggle = useCallback(() => {
    const next = getToggleZoomScale(zoomScale);
    const clamped = next <= ZOOMED_EPSILON ? 1 : Math.min(MAX_ZOOM_SCALE, next);
    publishScale(clamped);
  }, [zoomScale, publishScale]);

  const handleCenterTap = useCallback(() => {
    onCenterTap?.();
  }, [onCenterTap]);

  const handleTapLeft = useCallback(() => {
    onTapLeft?.();
  }, [onTapLeft]);

  const handleTapRight = useCallback(() => {
    onTapRight?.();
  }, [onTapRight]);

  const handleCenterDoubleTapAt = useCallback(
    (x: number) => {
      if (chromeVisible) {
        return;
      }
      // x is viewport-relative; edge taps are handled by the overlay Pressables.
      if (getTapZone(x, viewportWidth) !== 'center') {
        return;
      }
      zoomToToggle();
    },
    [chromeVisible, viewportWidth, zoomToToggle]
  );

  const handleCenterSingleTapAt = useCallback(
    (x: number) => {
      if (chromeVisible || isUserZoomed || getTapZone(x, viewportWidth) !== 'center') {
        return;
      }
      handleCenterTap();
    },
    [chromeVisible, isUserZoomed, viewportWidth, handleCenterTap]
  );

  const centerPressFit = useMemo(
    () =>
      createDoubleTapPressHandler({
        onSingle: handleCenterTap,
        onDouble: zoomToToggle,
      }),
    [handleCenterTap, zoomToToggle]
  );

  const pinch = Gesture.Pinch()
    .onStart(() => {
      pinchStartScale.value = zoomScaleSv.value;
      pinchLiveScale.value = zoomScaleSv.value;
    })
    .onUpdate((event) => {
      pinchLiveScale.value = Math.min(
        MAX_ZOOM_SCALE,
        Math.max(1, pinchStartScale.value * event.scale)
      );
    })
    .onEnd(() => {
      const next = pinchLiveScale.value <= ZOOMED_EPSILON ? 1 : pinchLiveScale.value;
      runOnJS(publishScale)(next);
    });

  const animatedFitStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pinchLiveScale.value / zoomScaleSv.value }],
  }));

  const animatedPanStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -panX.value }, { translateY: -panY.value }],
  }));

  /** Pressables above gesture layer — L/R page turn whenever chrome is hidden. */
  const tapOverlay = !chromeVisible ? (
    <View style={styles.tapOverlay} pointerEvents="box-none">
      <Pressable
        style={[styles.edgeZone, styles.edgeLeft, { width: leftWidth }]}
        onPress={handleTapLeft}
        accessibilityLabel="Previous page"
      />
      <Pressable
        style={[styles.edgeZone, styles.edgeRight, { width: rightWidth }]}
        onPress={handleTapRight}
        accessibilityLabel="Next page"
      />
      {!needsPan ? (
        <Pressable
          style={[styles.centerZone, { left: leftWidth, right: rightWidth }]}
          onPress={centerPressFit}
          accessibilityLabel="Toggle reader controls or double-tap to zoom"
        />
      ) : isUserZoomed ? (
        <Pressable
          style={styles.chromePeek}
          onPress={handleCenterTap}
          accessibilityLabel="Show reader controls"
        />
      ) : null}
    </View>
  ) : null;

  if (baseWidth <= 0 || baseHeight <= 0) {
    return <View style={styles.viewport}>{children}</View>;
  }

  if (!needsPan) {
    return (
      <View style={[styles.viewport, { width: viewportWidth, height: viewportHeight }]}>
        <GestureDetector gesture={pinch}>
          <View style={styles.gestureRoot} collapsable={false}>
            <Animated.View
              style={[styles.page, { width: baseWidth, height: baseHeight }, animatedFitStyle]}
              collapsable={false}
            >
              {children}
            </Animated.View>
          </View>
        </GestureDetector>
        {tapOverlay}
      </View>
    );
  }

  const pan = Gesture.Pan()
    .minDistance(8)
    .activeOffsetX([-10, 10])
    .activeOffsetY([-10, 10])
    .onBegin(() => {
      panStartX.value = panX.value;
      panStartY.value = panY.value;
    })
    .onUpdate((event) => {
      panX.value = Math.min(
        maxPanXSv.value,
        Math.max(0, panStartX.value - event.translationX)
      );
      panY.value = Math.min(
        maxPanYSv.value,
        Math.max(0, panStartY.value - event.translationY)
      );
    });

  const pinchZoomed = Gesture.Pinch()
    .onStart(() => {
      pinchStartScale.value = zoomScaleSv.value;
      pinchLiveScale.value = zoomScaleSv.value;
    })
    .onUpdate((event) => {
      pinchLiveScale.value = Math.min(
        MAX_ZOOM_SCALE,
        Math.max(1, pinchStartScale.value * event.scale)
      );
    })
    .onEnd(() => {
      const next = pinchLiveScale.value <= ZOOMED_EPSILON ? 1 : pinchLiveScale.value;
      runOnJS(publishScale)(next);
    });

  const doubleTapCenter = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(DOUBLE_TAP_DELAY_MS)
    .maxDistance(24)
    .onEnd((event) => {
      runOnJS(handleCenterDoubleTapAt)(event.x);
    });

  const singleTapCenter = Gesture.Tap()
    .numberOfTaps(1)
    .maxDuration(DOUBLE_TAP_DELAY_MS)
    .maxDistance(24)
    .requireExternalGestureToFail(doubleTapCenter)
    .onEnd((event) => {
      runOnJS(handleCenterSingleTapAt)(event.x);
    });

  const panGestures = Gesture.Simultaneous(
    Gesture.Exclusive(doubleTapCenter, singleTapCenter),
    pan,
    pinchZoomed
  );

  return (
    <View style={[styles.viewport, { width: viewportWidth, height: viewportHeight }]}>
      <GestureDetector gesture={panGestures}>
        <View
          style={{ width: viewportWidth, height: viewportHeight }}
          collapsable={false}
        >
          <Animated.View
            style={[
              styles.panContent,
              { width: scaledWidth, height: scaledHeight },
              animatedPanStyle,
            ]}
            collapsable={false}
          >
            {children}
          </Animated.View>
        </View>
      </GestureDetector>
      {tapOverlay}
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    overflow: 'hidden',
  },
  gestureRoot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  page: {
    overflow: 'hidden',
  },
  panContent: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  tapOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  edgeZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    zIndex: 21,
  },
  edgeLeft: {
    left: 0,
  },
  edgeRight: {
    right: 0,
  },
  centerZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    zIndex: 20,
  },
  chromePeek: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 48,
    height: 48,
    zIndex: 20,
  },
});
