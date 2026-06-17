// src/screens/LibraryDetailScreen.tsx
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, memo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Dimensions, Keyboard, RefreshControl, ScrollView, Platform, ViewToken } from 'react-native';
import { Text, ActivityIndicator, Card, Searchbar, Chip, Button } from 'react-native-paper';
import { Image } from 'expo-image';
import { useServerStore } from '../stores/serverStore';
import { useAppTheme } from '../hooks/useAppTheme';
import { SeriesDto } from '../types/kavita';
import { formatSeriesListSubtitle, seriesProgressPercent } from '../utils/seriesInfo';
import type { Theme } from '../utils/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import ScreenHeaderActions from '../components/ScreenHeaderActions';
import { useLibraryReloadOnFocus } from '../hooks/useLibraryReloadOnFocus';
import { useLibraryDisplayStore } from '../stores/libraryDisplayStore';

type Props = NativeStackScreenProps<RootStackParamList, 'LibraryDetail'>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
const COVER_HEIGHT = CARD_WIDTH * 1.5;
const INFO_HEIGHT = 96;
const ROW_MARGIN = 16;
/** Total height per grid row (two cards + bottom gap). Used by getItemLayout. */
const ROW_HEIGHT = COVER_HEIGHT + INFO_HEIGHT + ROW_MARGIN;
const PAGE_SIZE = 100;

type SeriesRow = SeriesDto[];

type SeriesCardProps = {
  item: SeriesDto;
  coverUrl: string;
  onPress: (seriesId: number) => void;
  theme: Theme;
  placeholderColor: string;
};

const SeriesCard = memo(function SeriesCard({ item, coverUrl, onPress, theme, placeholderColor }: SeriesCardProps) {
  const progress = seriesProgressPercent(item);
  const subtitle = formatSeriesListSubtitle(item);

  return (
    <TouchableOpacity
      style={styles.seriesCard}
      onPress={() => onPress(item.id)}
      activeOpacity={0.7}
    >
      <Card style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={[styles.coverFrame, { backgroundColor: placeholderColor }]}>
          <Image
            source={{ uri: coverUrl }}
            style={styles.cover}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={0}
            recyclingKey={String(item.id)}
          />
        </View>
        <Card.Content style={styles.cardInfo}>
          <Text variant="bodyMedium" numberOfLines={2} style={[styles.seriesTitle, { color: theme.text }]}>
            {item.name}
          </Text>
          <Text variant="bodySmall" numberOfLines={1} style={[styles.seriesInfo, { color: theme.textSecondary }]}>
            {subtitle || ' '}
          </Text>
          <View style={styles.progressSlot}>
            {progress > 0 ? (
              <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress}%`,
                      backgroundColor: theme.primary,
                    },
                  ]}
                />
              </View>
            ) : null}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
});

export default function LibraryDetailScreen({ route, navigation }: Props) {
  const { libraryId, libraryName, collectionId } = route.params;
  const isCollection = collectionId != null;
  const [series, setSeries] = useState<SeriesDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'recent'>('name');
  const hasSeriesRef = useRef(false);
  hasSeriesRef.current = series.length > 0;

  const primaryServerId = useServerStore((state) => state.primaryServerId);
  const serverUrl = useServerStore((state) => {
    const id = state.primaryServerId ?? state.servers[0]?.id;
    return state.servers.find((s) => s.id === id)?.url ?? null;
  });

  const client = useMemo(() => {
    if (!serverUrl) return null;
    return useServerStore.getState().getActiveClient();
  }, [serverUrl, primaryServerId]);

  const theme = useAppTheme();
  const resetToken = useLibraryDisplayStore((state) => state.resetToken);

  const loadSeries = useCallback(async (options?: { refresh?: boolean; reset?: boolean }) => {
    const isRefresh = options?.refresh === true;
    const isReset = options?.reset === true;

    if (!client) {
      setError('Not connected to a server. Go back and sign in again.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (libraryId == null && collectionId == null) {
      setError('Missing library or collection.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setError(null);
    if (isReset) {
      setSeries([]);
      setSearchQuery('');
      setLoading(true);
    } else if (isRefresh) {
      setRefreshing(true);
    } else if (!hasSeriesRef.current) {
      setLoading(true);
    }

    try {
      let items: SeriesDto[];
      const noCache = isReset || isRefresh;

      if (isCollection) {
        items = isReset
          ? await client.getAllSeriesByCollection(collectionId, { noCache })
          : await client.getSeriesByCollection(collectionId, 0, PAGE_SIZE, { noCache: isRefresh });
      } else {
        items = isReset
          ? await client.getAllSeriesInLibrary(libraryId!, { noCache })
          : await client.getSeries(libraryId!, 0, PAGE_SIZE, { noCache: isRefresh });
      }

      setSeries(items.filter((s): s is SeriesDto => typeof s.id === 'number'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load series';
      setError(message);
      console.error('Failed to load series:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [client, libraryId, collectionId, isCollection]);

  useEffect(() => {
    loadSeries();
  }, [loadSeries]);

  const handleRefresh = useCallback(() => {
    loadSeries({ refresh: true });
  }, [loadSeries]);

  const handleFullReset = useCallback(() => {
    loadSeries({ reset: true });
  }, [loadSeries]);

  useLibraryReloadOnFocus(handleFullReset);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: libraryName,
      headerRight: () => (
        <ScreenHeaderActions
          navigation={navigation}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      ),
    });
  }, [navigation, handleRefresh, refreshing]);

  const getCoverUrl = useCallback((seriesId: number) => {
    if (!client) return '';
    return client.getCoverImageUrl(seriesId);
  }, [client]);

  const sortedSeries = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const filtered = series.filter((s) =>
      s.name?.toLowerCase().includes(query)
    );
    return [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return new Date(b.created || 0).getTime() - new Date(a.created || 0).getTime();
    });
  }, [series, searchQuery, sortBy]);

  /** Pair series into rows — avoids FlatList numColumns + getItemLayout scroll bugs. */
  const seriesRows = useMemo(() => {
    const rows: SeriesRow[] = [];
    for (let i = 0; i < sortedSeries.length; i += 2) {
      rows.push(sortedSeries.slice(i, i + 2));
    }
    return rows;
  }, [sortedSeries]);

  const prefetchCoverUrls = useCallback((items: SeriesDto[]) => {
    if (!client) return;
    items.forEach((item) => {
      const url = client.getCoverImageUrl(item.id);
      if (url) {
        void Image.prefetch(url);
      }
    });
  }, [client]);

  const onViewableRowsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<SeriesRow>[] }) => {
      const visible: SeriesDto[] = [];
      let maxRowIndex = -1;

      viewableItems.forEach((token) => {
        if (token.item) {
          visible.push(...token.item);
        }
        if (typeof token.index === 'number' && token.index > maxRowIndex) {
          maxRowIndex = token.index;
        }
      });

      prefetchCoverUrls(visible);

      if (maxRowIndex >= 0) {
        const ahead: SeriesDto[] = [];
        for (let row = maxRowIndex + 1; row <= maxRowIndex + 3 && row < seriesRows.length; row += 1) {
          ahead.push(...seriesRows[row]);
        }
        prefetchCoverUrls(ahead);
      }
    },
    [prefetchCoverUrls, seriesRows]
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 15 }).current;

  useEffect(() => {
    if (seriesRows.length === 0) return;
    prefetchCoverUrls(seriesRows.slice(0, 6).flat());
  }, [seriesRows, prefetchCoverUrls]);

  const handleSeriesPress = useCallback((seriesId: number) => {
    navigation.navigate('SeriesDetail', { seriesId });
  }, [navigation]);

  const renderSeriesRow = useCallback(({ item: row }: { item: SeriesRow }) => (
    <View style={styles.row}>
      {row.map((item) => (
        <SeriesCard
          key={item.id}
          item={item}
          coverUrl={getCoverUrl(item.id)}
          onPress={handleSeriesPress}
          theme={theme}
          placeholderColor={theme.border}
        />
      ))}
      {row.length === 1 ? <View style={styles.rowSpacer} /> : null}
    </View>
  ), [getCoverUrl, handleSeriesPress, theme]);

  const rowKeyExtractor = useCallback(
    (row: SeriesRow) => row.map((item) => item.id).join('-'),
    []
  );

  const getRowLayout = useCallback(
    (_: ArrayLike<SeriesRow> | null | undefined, index: number) => ({
      length: ROW_HEIGHT,
      offset: ROW_HEIGHT * index,
      index,
    }),
    []
  );

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading series...</Text>
      </View>
    );
  }

  if (error && series.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text variant="titleLarge" style={{ color: theme.text, textAlign: 'center' }}>
          Could not load library
        </Text>
        <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.textSecondary }]}>
          {error}
        </Text>
        <Button mode="contained" onPress={() => loadSeries()} style={styles.retryButton}>
          Retry
        </Button>
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

      {isCollection ? (
        <Text variant="bodySmall" style={[styles.collectionHint, { color: theme.textSecondary }]}>
          Kavita collection tag — can include series from any library. Use Libraries above for per-library views.
        </Text>
      ) : null}

      <Searchbar
        placeholder="Search in library..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchBar, { backgroundColor: theme.surface }]}
        onBlur={() => Keyboard.dismiss()}
        iconColor={theme.textSecondary}
        placeholderTextColor={theme.textTertiary}
        inputStyle={{ color: theme.text }}
      />

      <View style={styles.filterRow}>
        <Chip
          selected={sortBy === 'name'}
          onPress={() => {
            Keyboard.dismiss();
            setSortBy('name');
          }}
          style={[styles.chip, { backgroundColor: sortBy === 'name' ? theme.primaryLight : theme.surface }]}
          textStyle={{ color: sortBy === 'name' ? '#fff' : theme.text }}
        >
          A-Z
        </Chip>
        <Chip
          selected={sortBy === 'recent'}
          onPress={() => {
            Keyboard.dismiss();
            setSortBy('recent');
          }}
          style={[styles.chip, { backgroundColor: sortBy === 'recent' ? theme.primaryLight : theme.surface }]}
          textStyle={{ color: sortBy === 'recent' ? '#fff' : theme.text }}
        >
          Recently Added
        </Chip>
      </View>

      {sortedSeries.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.centerContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadSeries({ refresh: true })}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        >
          <Text variant="titleLarge" style={{ color: theme.text }}>No series found</Text>
          <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.textSecondary }]}>
            {searchQuery
              ? 'Try a different search term'
              : series.length === 0
                ? `${libraryName} appears empty on the server.`
                : 'No matches for your search.'}
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          key={`${collectionId ?? libraryId}-${resetToken}`}
          data={seriesRows}
          renderItem={renderSeriesRow}
          keyExtractor={rowKeyExtractor}
          style={styles.list}
          contentContainerStyle={styles.gridContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android' ? false : undefined}
          getItemLayout={getRowLayout}
          onViewableItemsChanged={onViewableRowsChanged}
          viewabilityConfig={viewabilityConfig}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadSeries({ refresh: true })}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        />
      )}
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
  collectionHint: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  retryButton: {
    marginTop: 16,
  },
  searchBar: {
    margin: 16,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  chip: {
  },
  list: {
    flex: 1,
  },
  gridContent: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: ROW_HEIGHT - ROW_MARGIN,
    marginBottom: ROW_MARGIN,
  },
  rowSpacer: {
    width: CARD_WIDTH,
  },
  seriesCard: {
    width: CARD_WIDTH,
    height: COVER_HEIGHT + INFO_HEIGHT,
  },
  card: {
    elevation: 2,
    overflow: 'hidden',
    height: '100%',
  },
  coverFrame: {
    width: '100%',
    height: COVER_HEIGHT,
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    height: COVER_HEIGHT,
  },
  cardInfo: {
    height: INFO_HEIGHT,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  seriesTitle: {
    fontWeight: '600',
    marginBottom: 2,
    lineHeight: 20,
  },
  seriesInfo: {
    marginBottom: 2,
    lineHeight: 16,
  },
  progressSlot: {
    height: 7,
    justifyContent: 'center',
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
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
  },
});
