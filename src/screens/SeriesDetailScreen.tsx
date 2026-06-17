// src/screens/SeriesDetailScreen.tsx
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ViewToken,
  Keyboard,
} from 'react-native';
import { Text, ActivityIndicator, Card, Chip, IconButton, Button, Searchbar } from 'react-native-paper';
import { Image } from 'expo-image';
import { useFocusEffect } from '@react-navigation/native';
import { useServerStore } from '../stores/serverStore';
import { useAppTheme } from '../hooks/useAppTheme';
import {
  formatVolumeTitle,
  formatSeriesStatsLabel,
  formatChapterTitle,
} from '../utils/volumeDisplay';
import type { VolumeChapterItem, VolumeListItem } from '../utils/volumeDisplay';
import { buildSeriesDetailRows, filterVolumesForSearch, type SeriesDetailRow } from '../utils/seriesDetailList';
import { getFileIcon, getFileTypeColor, getFileTypeLabel } from '../utils/seriesChapterMeta';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { Theme } from '../utils/theme';
import type { KavitaClient } from '../api/kavitaClient';

type Props = NativeStackScreenProps<RootStackParamList, 'SeriesDetail'>;

type SeriesHeaderData = {
  id: number;
  name: string;
  summary?: string;
  libraryId?: number;
};

const LIST_ROW_GAP = 8;
/** Series header cover — card covers use same 2:3 ratio, 75% scale (fixed size, no stretch). */
const SERIES_COVER_WIDTH = 120;
const SERIES_COVER_HEIGHT = 180;
const CARD_COVER_WIDTH = 90;
const CARD_COVER_HEIGHT = (SERIES_COVER_HEIGHT * CARD_COVER_WIDTH) / SERIES_COVER_WIDTH;
const CARD_CONTENT_PADDING_V = 4;
const CHAPTER_ROW_HEIGHT = CARD_COVER_HEIGHT + CARD_CONTENT_PADDING_V * 2 + LIST_ROW_GAP;
const VOLUME_HEADER_HEIGHT = 114 + LIST_ROW_GAP;
const VOLUME_CARD_HEIGHT = CHAPTER_ROW_HEIGHT;

function rowLayoutHeight(row: SeriesDetailRow): number {
  if (row.kind === 'volume-header') return VOLUME_HEADER_HEIGHT;
  if (row.kind === 'volume-card') return VOLUME_CARD_HEIGHT;
  return CHAPTER_ROW_HEIGHT;
}

type ChapterMetaProps = {
  chapter: VolumeChapterItem;
  theme: Theme;
};

const ChapterMeta = memo(function ChapterMeta({ chapter, theme }: ChapterMetaProps) {
  const fileType = getFileTypeLabel(chapter);
  const fileColor = getFileTypeColor(chapter, theme.textSecondary);
  const fileIcon = getFileIcon(chapter);
  const progress =
    chapter.pagesRead != null && chapter.pages != null && chapter.pagesRead > 0 && chapter.pages > 0
      ? (chapter.pagesRead / chapter.pages) * 100
      : 0;

  return (
    <>
      <View style={styles.chapterMeta}>
        <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
          {chapter.pages ?? 0} pages
        </Text>
        {progress > 0 ? (
          <>
            <Text style={{ color: theme.textSecondary }}> • </Text>
            <Text variant="bodySmall" style={{ color: theme.primary }}>
              {Math.round(progress)}% read
            </Text>
          </>
        ) : null}
      </View>
      {progress > 0 ? (
        <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%`, backgroundColor: theme.primary },
            ]}
          />
        </View>
      ) : null}
      <View style={styles.fileTypeRow}>
        <Chip
          icon={fileIcon}
          style={[styles.fileTypeChip, { backgroundColor: fileColor }]}
          textStyle={{ color: '#fff', fontSize: 12, fontWeight: '600' }}
          compact={false}
        >
          {fileType}
        </Chip>
      </View>
    </>
  );
});

type DetailRowProps = {
  row: SeriesDetailRow;
  theme: Theme;
  client: KavitaClient | null;
  onChapterPress: (volume: VolumeListItem, chapter: VolumeChapterItem) => void;
};

const DetailRow = memo(function DetailRow({
  row,
  theme,
  client,
  onChapterPress,
}: DetailRowProps) {
  const volumeCoverUrl = client ? client.getVolumeCoverUrl(row.volume.id) : '';
  const chapterCoverUrl =
    row.kind === 'chapter' || row.kind === 'volume-card'
      ? client?.getChapterCoverUrl(row.chapter.id) ?? ''
      : '';

  if (row.kind === 'volume-header') {
    const chapters = row.volume.chapters ?? [];
    return (
      <View style={[styles.volumeHeader, { backgroundColor: theme.surface }]}>
        <Image
          source={{ uri: volumeCoverUrl }}
          style={styles.volumeCover}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={0}
          recyclingKey={`vol-${row.volume.id}`}
        />
        <View style={styles.volumeInfo}>
          <Text variant="titleMedium" style={[styles.volumeTitle, { color: theme.text }]}>
            {formatVolumeTitle(row.volume)}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
            {chapters.length} {chapters.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
      </View>
    );
  }

  if (row.kind === 'volume-card') {
    const { chapter, volume } = row;
    return (
      <TouchableOpacity onPress={() => onChapterPress(volume, chapter)}>
        <Card style={[styles.volumeCard, { backgroundColor: theme.surface }]}>
          <Card.Content style={styles.volumeCardContent}>
            <Image
              source={{ uri: volumeCoverUrl }}
              style={styles.cardCover}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={0}
              recyclingKey={`vol-${volume.id}`}
            />
            <View style={styles.volumeCardInfo}>
              <Text variant="titleMedium" style={[styles.volumeTitle, { color: theme.text }]}>
                {formatVolumeTitle(volume)}
              </Text>
              <ChapterMeta chapter={chapter} theme={theme} />
            </View>
            <IconButton
              icon="chevron-right"
              size={20}
              iconColor={theme.textSecondary}
              style={styles.cardChevron}
            />
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  }

  const { chapter, volume, chapterIndex } = row;
  const displayTitle = formatChapterTitle(chapter, volume, chapterIndex);

  return (
    <TouchableOpacity onPress={() => onChapterPress(volume, chapter)}>
      <Card style={[styles.chapterCard, { backgroundColor: theme.surface }]}>
        <Card.Content style={styles.chapterContent}>
          <Image
            source={{ uri: chapterCoverUrl }}
            style={styles.cardCover}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={0}
            recyclingKey={`ch-${chapter.id}`}
          />
          <View style={styles.chapterInfo}>
            <Text variant="bodyLarge" style={[styles.chapterTitle, { color: theme.text }]}>
              {displayTitle}
            </Text>
            <ChapterMeta chapter={chapter} theme={theme} />
          </View>
          <IconButton
            icon="chevron-right"
            size={20}
            iconColor={theme.textSecondary}
            style={styles.cardChevron}
          />
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
});

export default function SeriesDetailScreen({ route, navigation }: Props) {
  const { seriesId, seriesName, seriesSummary } = route.params;
  const theme = useAppTheme();
  const loadRequestRef = useRef(0);

  const [series, setSeries] = useState<SeriesHeaderData | null>(
    seriesName
      ? { id: seriesId, name: seriesName, summary: seriesSummary }
      : null
  );
  const [volumes, setVolumes] = useState<VolumeListItem[]>([]);
  const [loadingSeries, setLoadingSeries] = useState(!seriesName);
  const [loadingVolumes, setLoadingVolumes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const primaryServerId = useServerStore((state) => state.primaryServerId);
  const serverUrl = useServerStore((state) => {
    const id = state.primaryServerId ?? state.servers[0]?.id;
    return state.servers.find((s) => s.id === id)?.url ?? null;
  });

  const client = useMemo(() => {
    if (!serverUrl) return null;
    return useServerStore.getState().getActiveClient();
  }, [serverUrl, primaryServerId]);

  const filteredVolumes = useMemo(
    () => filterVolumesForSearch(volumes, searchQuery),
    [volumes, searchQuery]
  );

  const rows = useMemo(() => buildSeriesDetailRows(filteredVolumes), [filteredVolumes]);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const clientRef = useRef(client);
  clientRef.current = client;

  const loadSeriesDetails = useCallback(async () => {
    if (!client) {
      setError('Not connected to a server.');
      setLoadingSeries(false);
      setLoadingVolumes(false);
      return;
    }

    const requestId = ++loadRequestRef.current;
    setError(null);
    if (!seriesName) {
      setLoadingSeries(true);
    }
    setLoadingVolumes(true);
    setVolumes([]);

    try {
      const seriesData = await client.getSeriesById(seriesId);
      if (requestId !== loadRequestRef.current) return;

      setSeries({
        id: seriesData.id ?? seriesId,
        name: seriesData.name ?? seriesName ?? 'Series',
        summary: seriesData.summary,
        libraryId: seriesData.libraryId,
      });
      setLoadingSeries(false);

      const volumesData = (await client.getVolumes(seriesId)) as VolumeListItem[];
      if (requestId !== loadRequestRef.current) return;

      setVolumes(Array.isArray(volumesData) ? volumesData : []);
    } catch (err: unknown) {
      if (requestId !== loadRequestRef.current) return;
      const message = err instanceof Error ? err.message : 'Failed to load series details';
      setError(message);
      console.error('Failed to load series details:', err);
    } finally {
      if (requestId === loadRequestRef.current) {
        setLoadingSeries(false);
        setLoadingVolumes(false);
      }
    }
  }, [client, seriesId, seriesName]);

  /** Silent refresh after reader exit — keeps list visible, updates pagesRead bars. */
  const refreshVolumesProgress = useCallback(async () => {
    if (!client) return;

    const requestId = ++loadRequestRef.current;

    try {
      const volumesData = (await client.getVolumes(seriesId)) as VolumeListItem[];
      if (requestId !== loadRequestRef.current) return;
      setVolumes(Array.isArray(volumesData) ? volumesData : []);
    } catch (err: unknown) {
      if (requestId !== loadRequestRef.current) return;
      console.warn('Failed to refresh series progress:', err);
    }
  }, [client, seriesId]);

  const skipFocusRefreshRef = useRef(true);

  useEffect(() => {
    void loadSeriesDetails();
    return () => {
      loadRequestRef.current += 1;
    };
  }, [loadSeriesDetails]);

  useFocusEffect(
    useCallback(() => {
      if (skipFocusRefreshRef.current) {
        skipFocusRefreshRef.current = false;
        return;
      }
      void refreshVolumesProgress();
    }, [refreshVolumesProgress])
  );

  const handleChapterPress = useCallback(
    (volume: VolumeListItem, chapter: VolumeChapterItem) => {
      if (!client) return;

      navigation.navigate('Reader', {
        chapterId: chapter.id,
        seriesId,
        volumeId: volume.id,
        libraryId: series?.libraryId,
        chapterFormat: chapter.format,
        fileName: chapter.fileName,
      });

      void client.cacheChapter(chapter.id).catch((cacheErr) => {
        console.warn('Background chapter cache failed:', cacheErr);
      });
    },
    [client, navigation, seriesId, series?.libraryId]
  );

  const renderItem = useCallback(
    ({ item }: { item: SeriesDetailRow }) => (
      <DetailRow
        row={item}
        theme={theme}
        client={client}
        onChapterPress={handleChapterPress}
      />
    ),
    [theme, client, handleChapterPress]
  );

  const keyExtractor = useCallback((item: SeriesDetailRow) => item.key, []);

  const getItemLayout = useCallback(
    (_: ArrayLike<SeriesDetailRow> | null | undefined, index: number) => {
      let offset = 0;
      for (let i = 0; i < index; i += 1) {
        const row = rows[i];
        if (row) offset += rowLayoutHeight(row);
      }
      const current = rows[index];
      const length = current ? rowLayoutHeight(current) : CHAPTER_ROW_HEIGHT;
      return { length, offset, index };
    },
    [rows]
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<SeriesDetailRow>[] }) => {
      const activeClient = clientRef.current;
      if (!activeClient) return;

      const prefetchUrl = (url: string) => {
        if (url) void Image.prefetch(url);
      };

      viewableItems.forEach((token) => {
        const row = token.item;
        if (!row) return;
        if (row.kind === 'chapter' || row.kind === 'volume-card') {
          prefetchUrl(activeClient.getChapterCoverUrl(row.chapter.id));
        }
        if (row.kind === 'volume-header' || row.kind === 'volume-card') {
          prefetchUrl(activeClient.getVolumeCoverUrl(row.volume.id));
        }
      });

      const maxIndex = viewableItems.reduce(
        (max, token) => (typeof token.index === 'number' && token.index > max ? token.index : max),
        -1
      );
      const ahead = rowsRef.current.slice(maxIndex + 1, maxIndex + 4);
      ahead.forEach((row) => {
        if (row.kind === 'chapter' || row.kind === 'volume-card') {
          prefetchUrl(activeClient.getChapterCoverUrl(row.chapter.id));
        }
      });
    }
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 20 }).current;

  const ListHeader = useMemo(() => {
    if (!series) return null;
    const statsLabel = volumes.length > 0 ? formatSeriesStatsLabel(volumes) : null;

    return (
      <View style={[styles.seriesHeader, { backgroundColor: theme.surface }]}>
        <Image
          source={{ uri: client?.getCoverImageUrl(seriesId) ?? '' }}
          style={styles.seriesCover}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={0}
          recyclingKey={`series-${seriesId}`}
        />
        <View style={styles.seriesInfo}>
          <Text variant="headlineSmall" style={[styles.seriesTitle, { color: theme.text }]}>
            {series.name}
          </Text>
          {series.summary ? (
            <Text variant="bodyMedium" style={[styles.seriesSummary, { color: theme.textSecondary }]}>
              {series.summary}
            </Text>
          ) : null}
          {statsLabel ? (
            <View style={styles.statsRow}>
              <Chip
                icon="book-open-variant"
                style={{ backgroundColor: theme.primaryLight }}
                textStyle={{ color: '#fff', fontWeight: '600' }}
              >
                {statsLabel}
              </Chip>
            </View>
          ) : null}
        </View>
      </View>
    );
  }, [series, volumes.length, theme, client, seriesId]);

  const ListFooter = useCallback(() => {
    if (!loadingVolumes) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.primary} />
        <Text variant="bodySmall" style={{ color: theme.textSecondary, marginTop: 8 }}>
          Loading volumes…
        </Text>
      </View>
    );
  }, [loadingVolumes, theme]);

  const ListEmpty = useCallback(() => {
    if (loadingVolumes) return null;
    if (!searchQuery.trim()) return null;

    return (
      <View style={styles.emptySearch}>
        <Text variant="bodyMedium" style={{ color: theme.textSecondary, textAlign: 'center' }}>
          No volumes or chapters match &quot;{searchQuery.trim()}&quot;
        </Text>
      </View>
    );
  }, [loadingVolumes, searchQuery, theme.textSecondary]);

  const showInitialLoader = loadingSeries && !series;

  if (showInitialLoader) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading series…</Text>
        </View>
      </View>
    );
  }

  if (error && !series) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text variant="titleMedium" style={{ color: theme.error, textAlign: 'center', padding: 24 }}>
          {error}
        </Text>
        <Button mode="contained" onPress={() => void loadSeriesDetails()}>
          Retry
        </Button>
      </View>
    );
  }

  if (!series) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text variant="titleLarge" style={{ color: theme.text }}>
          Series not found
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {error ? (
        <Text variant="bodySmall" style={[styles.errorBanner, { color: theme.error }]}>
          {error}
        </Text>
      ) : null}

      <Searchbar
        placeholder="Search volumes and chapters…"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchBar, { backgroundColor: theme.surface }]}
        onBlur={() => Keyboard.dismiss()}
        iconColor={theme.textSecondary}
        placeholderTextColor={theme.textTertiary}
        inputStyle={{ color: theme.text }}
      />

      <FlatList
        data={rows}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={rows.length === 0 ? styles.listContentEmpty : styles.listContent}
        style={styles.list}
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android' ? false : undefined}
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
  },
  errorBanner: {
    paddingHorizontal: 16,
    paddingTop: 8,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  listContentEmpty: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  list: {
    flex: 1,
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 8,
    elevation: 0,
  },
  emptySearch: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  footerLoader: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  seriesHeader: {
    padding: 16,
    flexDirection: 'row',
    gap: 16,
  },
  seriesCover: {
    width: SERIES_COVER_WIDTH,
    height: SERIES_COVER_HEIGHT,
    borderRadius: 8,
  },
  seriesInfo: {
    flex: 1,
    gap: 8,
  },
  seriesTitle: {
    fontWeight: '600',
  },
  seriesSummary: {
    fontSize: 14,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  volumeHeader: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: LIST_ROW_GAP,
    padding: 12,
    borderRadius: 8,
  },
  volumeCard: {
    elevation: 1,
    marginHorizontal: 16,
    marginBottom: LIST_ROW_GAP,
  },
  volumeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: CARD_CONTENT_PADDING_V,
    paddingHorizontal: 8,
    gap: 10,
  },
  volumeCardInfo: {
    flex: 1,
    gap: 4,
  },
  cardCover: {
    width: CARD_COVER_WIDTH,
    height: CARD_COVER_HEIGHT,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  cardChevron: {
    margin: 0,
  },
  volumeCover: {
    width: CARD_COVER_WIDTH,
    height: CARD_COVER_HEIGHT,
    borderRadius: 4,
  },
  volumeInfo: {
    justifyContent: 'center',
    gap: 4,
  },
  volumeTitle: {
    fontWeight: '600',
  },
  chapterCard: {
    elevation: 1,
    marginHorizontal: 16,
    marginBottom: LIST_ROW_GAP,
  },
  chapterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: CARD_CONTENT_PADDING_V,
    paddingHorizontal: 8,
    gap: 10,
  },
  chapterInfo: {
    flex: 1,
    gap: 4,
  },
  chapterTitle: {
    fontWeight: '500',
  },
  fileTypeRow: {
    marginTop: 4,
  },
  fileTypeChip: {
    height: 32,
    alignSelf: 'flex-start',
  },
  chapterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
  },
});
