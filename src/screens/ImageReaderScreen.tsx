// src/screens/ImageReaderScreen.tsx
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  BackHandler,
  useWindowDimensions,
} from 'react-native';
import { Text, IconButton, ProgressBar, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Audio } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useServerStore } from '../stores/serverStore';
import { useThemeStore } from '../stores/themeStore';
import { exitReader, readerChromeOverlay } from '../utils/readerNavigation';
import { buildProgressPayload } from '../utils/readingProgress';
import { resolveReaderFitMode } from '../utils/readerFit';
import { getPageWarmIndices } from '../utils/chapterPageAssets';
import { createReaderPrefetchRunner } from '../utils/readerPagePrefetch';
import { resolveOfflinePageUri } from '../services/offlineChapterStorage';
import { useReaderSettingsStore } from '../stores/readerSettingsStore';
import { getPageDimensionsFromChapter, isPdfChapter } from '../utils/readerChapter';
import ZoomablePageView from '../components/reader/ZoomablePageView';
import type { ChapterInfoDto, ProgressDto } from '../types/kavita';
import type { PageImageAuthSource } from '../api/kavitaClient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Reader'>;

export default function ImageReaderScreen({ route, navigation }: Props) {
  const { chapterId, seriesId, volumeId, libraryId } = route.params;
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const [chapterInfo, setChapterInfo] = useState<ChapterInfoDto | null>(null);
  const [progressHint, setProgressHint] = useState<ProgressDto | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [progressSaveError, setProgressSaveError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [loadedImageSize, setLoadedImageSize] = useState<{ width: number; height: number } | null>(null);
  const [imageRetryKey, setImageRetryKey] = useState(0);
  const [pageZoomScale, setPageZoomScale] = useState(1);
  const [isPageZoomed, setIsPageZoomed] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const client = useServerStore((state) => state.getActiveClient());
  const primaryServerId = useServerStore(
    (state) => state.primaryServerId ?? state.servers[0]?.id ?? null
  );
  const fitModePreference = useReaderSettingsStore((state) => state.fitModePreference);
  const prefetchPages = useReaderSettingsStore((state) => state.prefetchPages);
  const cacheEntireAlbum = useReaderSettingsStore((state) => state.cacheEntireAlbum);
  const isGrayscaleReading = useThemeStore((state) => state.isGrayscaleReading);
  const pageTurnSoundsEnabled = useThemeStore((state) => state.pageTurnSoundsEnabled);

  const fitMode = resolveReaderFitMode(fitModePreference, windowWidth, windowHeight);

  const [localPageUri, setLocalPageUri] = useState<string | null>(null);

  const pageImageSource = useMemo((): PageImageAuthSource | { uri: string } | null => {
    if (localPageUri) {
      return { uri: localPageUri };
    }
    if (!client || !chapterInfo) {
      return null;
    }
    try {
      return client.getPageImageAuthSource(chapterId, currentPage, {
        extractPdf: isPdfChapter(chapterInfo),
      });
    } catch {
      return null;
    }
  }, [localPageUri, client, chapterInfo, chapterId, currentPage]);

  const knownPageSize = useMemo(() => {
    if (!chapterInfo) {
      return null;
    }
    return getPageDimensionsFromChapter(chapterInfo, currentPage);
  }, [chapterInfo, currentPage]);

  const imageNativeSize = knownPageSize ?? loadedImageSize;
  /** Fallback until onLoad or chapter dimensions arrive (ZoomablePageView needs numeric size). */
  const layoutNativeSize = imageNativeSize ?? { width: windowWidth, height: windowHeight };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await ScreenOrientation.unlockAsync();
      } catch (error) {
        if (!cancelled) {
          console.warn('Screen orientation unlock failed:', error);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    loadSound();
    loadChapter();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    setImageLoading(true);
    setImageError(false);
    setLoadedImageSize(null);
  }, [currentPage, chapterId]);

  useEffect(() => {
    setPageZoomScale(1);
    setIsPageZoomed(false);
  }, [chapterId]);

  useEffect(() => {
    let cancelled = false;
    if (!primaryServerId) {
      setLocalPageUri(null);
      return;
    }
    void resolveOfflinePageUri(primaryServerId, chapterId, currentPage).then((uri) => {
      if (!cancelled) {
        setLocalPageUri(uri);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [primaryServerId, chapterId, currentPage]);

  useEffect(() => {
    if (!client || !chapterInfo || totalPages <= 0) {
      return;
    }
    const indices = getPageWarmIndices(currentPage, totalPages, {
      prefetchPages,
      cacheEntireAlbum,
    });
    const runner = createReaderPrefetchRunner();
    void runner.warm(client, chapterId, chapterInfo, indices, {
      prefetchPages,
      cacheEntireAlbum,
    });
    return () => runner.cancel();
  }, [client, chapterId, chapterInfo, currentPage, totalPages, prefetchPages, cacheEntireAlbum]);

  const loadSound = async () => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('../../assets/page-turn.mp3'),
        { volume: 0.3 }
      );
      setSound(newSound);
    } catch {
      console.log('⚠️ Sound file not found - page turns will be silent');
    }
  };

  const playPageTurnSound = async () => {
    if (!pageTurnSoundsEnabled || !sound) return;

    try {
      await sound.replayAsync();
    } catch {
      console.log('⚠️ Failed to play sound');
    }
  };

  const loadChapter = async () => {
    if (!client) {
      return;
    }

    setLoading(true);

    try {
      const info = await client.getChapterInfoForReader(chapterId);
      const progress = await client.getProgress(chapterId);
      setProgressHint(progress);
      setChapterInfo(info);
      setTotalPages(info.pages || 0);

      const startPage = progress.pageNum > 0 ? progress.pageNum : 0;
      setCurrentPage(startPage);

      await client.cacheChapter(chapterId);
      setLoading(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.log('❌ Failed to load chapter:', message);
      Alert.alert('Error', 'Failed to load chapter');
      setLoading(false);
    }
  };

  const handleImageLoad = useCallback(
    (event: { source: { width: number; height: number } }) => {
      const { width, height } = event.source;
      if (width > 0 && height > 0) {
        setLoadedImageSize({ width, height });
      }
      setImageLoading(false);
      setImageError(false);
    },
    []
  );

  const handleImageError = useCallback(() => {
    setImageLoading(false);
    setImageError(true);
  }, []);

  const retryImageLoad = useCallback(() => {
    setImageError(false);
    setImageLoading(true);
    setImageRetryKey((key) => key + 1);
  }, []);

  const saveProgress = useCallback(async () => {
    if (!client || !chapterInfo || currentPage <= 0) {
      return;
    }

    try {
      await client.markProgress(
        buildProgressPayload(chapterInfo, chapterId, currentPage, {
          seriesIdFallback: seriesId,
          volumeIdFallback: volumeId,
          libraryIdFallback: libraryId,
          progressHint,
        })
      );
      setProgressSaveError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save reading progress';
      console.warn('Failed to save progress:', message);
      setProgressSaveError(message);
    }
  }, [client, chapterInfo, progressHint, seriesId, volumeId, libraryId, chapterId, currentPage]);

  const saveProgressRef = useRef(saveProgress);
  saveProgressRef.current = saveProgress;

  useEffect(() => {
    return () => {
      void saveProgressRef.current();
    };
  }, []);

  useEffect(() => {
    if (currentPage > 0 && chapterInfo) {
      const timeout = setTimeout(() => saveProgress(), 1000);
      return () => clearTimeout(timeout);
    }
  }, [currentPage, chapterInfo, saveProgress]);

  const handleExit = useCallback(() => {
    exitReader(navigation, saveProgress);
  }, [navigation, saveProgress]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleExit();
      return true;
    });
    return () => sub.remove();
  }, [handleExit]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 0) {
      playPageTurnSound();
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage, playPageTurnSound]);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      playPageTurnSound();
      setCurrentPage(currentPage + 1);
    } else {
      Alert.alert(
        'Chapter Complete',
        "You've reached the end of this chapter.",
        [
          { text: 'Stay Here', style: 'cancel' },
          { text: 'Go Back', onPress: handleExit },
        ]
      );
    }
  }, [currentPage, totalPages, playPageTurnSound, handleExit]);

  const handleReaderTapLeft = useCallback(() => {
    goToPreviousPage();
  }, [goToPreviousPage]);

  const handleReaderTapRight = useCallback(() => {
    goToNextPage();
  }, [goToNextPage]);

  const handleReaderCenterTap = useCallback(() => {
    setShowControls((visible) => !visible);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading chapter...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isGrayscaleReading && styles.grayscaleContainer]}>
      <View style={styles.imageContainer}>
        {imageLoading && pageImageSource && !imageError && (
          <View style={styles.imageLoadingOverlay}>
            <ActivityIndicator size="small" color="#1976D2" />
          </View>
        )}

        {imageError ? (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>Failed to load page {currentPage + 1}</Text>
            <Button mode="contained" onPress={retryImageLoad} style={styles.retryButton}>
              Retry
            </Button>
          </View>
        ) : pageImageSource ? (
          <ZoomablePageView
            viewportWidth={windowWidth}
            viewportHeight={windowHeight}
            imageWidth={layoutNativeSize.width}
            imageHeight={layoutNativeSize.height}
            fitMode={fitMode}
            zoomScale={pageZoomScale}
            panResetKey={currentPage}
            chromeVisible={showControls}
            onZoomScaleChange={setPageZoomScale}
            onZoomedChange={setIsPageZoomed}
            onCenterTap={handleReaderCenterTap}
            onTapLeft={handleReaderTapLeft}
            onTapRight={handleReaderTapRight}
          >
            <Image
              key={`${chapterId}-${currentPage}-${imageRetryKey}`}
              source={pageImageSource}
              recyclingKey={`${chapterId}-${currentPage}`}
              style={styles.pageImage}
              contentFit="contain"
              pointerEvents="none"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            {isGrayscaleReading && (
              <View style={styles.grayscaleOverlay} pointerEvents="none" />
            )}
          </ZoomablePageView>
        ) : (
          <View style={styles.placeholderContainer}>
            <ActivityIndicator size="large" color="#1976D2" />
            <Text style={styles.placeholderText}>Loading page...</Text>
          </View>
        )}
      </View>

      {showControls && (
        <Pressable
          style={styles.controlsDismissLayer}
          onPress={() => setShowControls(false)}
          accessibilityLabel="Hide reader controls"
        />
      )}

      {progressSaveError ? (
        <SafeAreaView style={[styles.progressErrorBanner, readerChromeOverlay]} edges={['top']}>
          <Text variant="bodySmall" style={styles.progressErrorText}>
            {progressSaveError}
          </Text>
        </SafeAreaView>
      ) : null}

      {showControls && (
        <>
          <SafeAreaView style={[styles.topBar, readerChromeOverlay]} edges={['top']}>
            <IconButton
              icon="arrow-left"
              iconColor="#fff"
              size={24}
              onPress={handleExit}
              accessibilityLabel="Go back"
            />
            <Text style={styles.topBarTitle} numberOfLines={1}>
              {chapterInfo?.title || 'Reading'}
            </Text>
            <View style={{ width: 48 }} />
          </SafeAreaView>

          <SafeAreaView style={[styles.bottomBar, readerChromeOverlay]} edges={['bottom']}>
            <ProgressBar
              progress={totalPages > 0 ? (currentPage + 1) / totalPages : 0}
              color="#1976D2"
              style={styles.progressBar}
            />
            <Text style={styles.pageInfo}>
              Page {currentPage + 1} / {totalPages}
            </Text>
            <View style={styles.controlButtons}>
              <IconButton
                icon="chevron-left"
                iconColor="#fff"
                size={28}
                onPress={goToPreviousPage}
                disabled={currentPage === 0}
              />
              <IconButton
                icon="chevron-right"
                iconColor="#fff"
                size={28}
                onPress={goToNextPage}
                disabled={currentPage >= totalPages - 1}
              />
            </View>
          </SafeAreaView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  grayscaleContainer: {
    backgroundColor: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 16,
    color: '#fff',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  controlsDismissLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  pageImage: {
    width: '100%',
    height: '100%',
  },
  grayscaleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  placeholderText: {
    color: '#fff',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
  },
  progressErrorBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(180, 40, 40, 0.92)',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  progressErrorText: {
    color: '#fff',
    textAlign: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingBottom: 10,
    paddingHorizontal: 8,
  },
  topBarTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 8,
  },
  pageInfo: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 8,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
});
