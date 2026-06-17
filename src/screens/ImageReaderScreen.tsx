// src/screens/ImageReaderScreen.tsx
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  BackHandler,
  useWindowDimensions,
} from 'react-native';
import { Text, IconButton, ProgressBar, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Audio } from 'expo-av';
import { useServerStore } from '../stores/serverStore';
import { useThemeStore } from '../stores/themeStore';
import { exitReader, readerChromeOverlay } from '../utils/readerNavigation';
import { buildProgressPayload } from '../utils/readingProgress';
import { autoFitMode, computeDisplaySize } from '../utils/readerFit';
import { getPageDimensionsFromChapter, isPdfChapter } from '../utils/readerChapter';
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
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const client = useServerStore((state) => state.getActiveClient());
  const isGrayscaleReading = useThemeStore((state) => state.isGrayscaleReading);
  const pageTurnSoundsEnabled = useThemeStore((state) => state.pageTurnSoundsEnabled);

  const fitMode = autoFitMode(windowWidth, windowHeight);
  const tapZoneWidth = windowWidth * 0.3;

  const pageImageSource = useMemo((): PageImageAuthSource | null => {
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
  }, [client, chapterInfo, chapterId, currentPage]);

  const knownPageSize = useMemo(() => {
    if (!chapterInfo) {
      return null;
    }
    return getPageDimensionsFromChapter(chapterInfo, currentPage);
  }, [chapterInfo, currentPage]);

  const imageNativeSize = knownPageSize ?? loadedImageSize;

  const displaySize = useMemo(() => {
    if (!imageNativeSize) {
      return { width: windowWidth, height: windowHeight };
    }
    return computeDisplaySize(
      imageNativeSize.width,
      imageNativeSize.height,
      windowWidth,
      windowHeight,
      fitMode
    );
  }, [imageNativeSize, windowWidth, windowHeight, fitMode]);

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

  const goToNextPage = () => {
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
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      playPageTurnSound();
      setCurrentPage(currentPage - 1);
    }
  };

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
      <TouchableOpacity
        style={styles.imageContainer}
        activeOpacity={1}
        onPress={() => setShowControls(!showControls)}
      >
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
          <View style={[styles.pageFrame, { width: displaySize.width, height: displaySize.height }]}>
            <Image
              key={`${chapterId}-${currentPage}-${imageRetryKey}`}
              source={pageImageSource}
              recyclingKey={`${chapterId}-${currentPage}`}
              style={styles.pageImage}
              contentFit="contain"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            {isGrayscaleReading && (
              <View style={styles.grayscaleOverlay} pointerEvents="none" />
            )}
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <ActivityIndicator size="large" color="#1976D2" />
            <Text style={styles.placeholderText}>Loading page...</Text>
          </View>
        )}
      </TouchableOpacity>

      {!showControls && (
        <>
          <TouchableOpacity
            style={[styles.pageTurnZone, { left: 0, width: tapZoneWidth }]}
            onPress={goToPreviousPage}
            activeOpacity={0.3}
          />
          <TouchableOpacity
            style={[styles.pageTurnZone, { right: 0, width: tapZoneWidth }]}
            onPress={goToNextPage}
            activeOpacity={0.3}
          />
        </>
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
  imageLoadingOverlay: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  pageFrame: {
    overflow: 'hidden',
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
  pageTurnZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    zIndex: 5,
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
