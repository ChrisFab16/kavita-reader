// src/screens/LibraryDetailScreen.tsx
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, memo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Keyboard, RefreshControl, ScrollView, Platform, ViewToken, BackHandler, useWindowDimensions, Alert } from 'react-native';
import { Text, ActivityIndicator, Card, Searchbar, Chip, Button } from 'react-native-paper';
import { Image } from 'expo-image';
import { useServerStore } from '../stores/serverStore';
import { useAppTheme } from '../hooks/useAppTheme';
import { SeriesDto } from '../types/kavita';
import { formatSeriesListSubtitle, seriesProgressPercent } from '../utils/seriesInfo';
import {
  hasMoreSeriesPages,
  mergeSeriesPages,
  type LibrarySortMode,
} from '../utils/seriesPagination';
import { describeEmptyLibraryLoad } from '../utils/librarySeriesLoad';
import type { Theme } from '../utils/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import ScreenHeaderActions from '../components/ScreenHeaderActions';
import { useLibraryReloadOnFocus } from '../hooks/useLibraryReloadOnFocus';
import { chunkIntoRows, getBrowseGridMetrics, isLandscape } from '../utils/responsiveLayout';
import { resolveSeriesGridMode } from '../api/kavitaPersonalLists';

type Props = NativeStackScreenProps<RootStackParamList, 'LibraryDetail'>;

const PAGE_SIZE = 100;

type SeriesRow = SeriesDto[];

type SeriesCardProps = {
  item: SeriesDto;
  coverUrl: string;
  onPress: (item: SeriesDto) => void;
  onLongPress?: (item: SeriesDto) => void;
  theme: Theme;
  placeholderColor: string;
  cardWidth: number;
  coverHeight: number;
  infoHeight: number;
};

const SeriesCard = memo(function SeriesCard({
  item,
  coverUrl,
  onPress,
  onLongPress,
  theme,
  placeholderColor,
  cardWidth,
  coverHeight,
  infoHeight,
}: SeriesCardProps) {
  const progress = seriesProgressPercent(item);
  const subtitle = formatSeriesListSubtitle(item);

  return (
    <TouchableOpacity
      style={{ width: cardWidth, height: coverHeight + infoHeight }}
      onPress={() => onPress(item)}
      onLongPress={onLongPress ? () => onLongPress(item) : undefined}
      activeOpacity={0.7}
    >
      <Card style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={[styles.coverFrame, { backgroundColor: placeholderColor, height: coverHeight }]}>
          <Image
            source={{ uri: coverUrl }}
            style={[styles.cover, { height: coverHeight }]}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={0}
            recyclingKey={String(item.id)}
          />
        </View>
        <Card.Content style={[styles.cardInfo, { height: infoHeight }]}>
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
  const { libraryId, libraryName, collectionId, gridMode: gridModeParam } = route.params;
  const gridMode = resolveSeriesGridMode({ gridMode: gridModeParam, collectionId, libraryId });
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const gridMetrics = useMemo(() => getBrowseGridMetrics(windowWidth), [windowWidth]);
  const compactLayout = isLandscape(windowWidth, windowHeight);
  const isCollection = gridMode === 'collection';
  const isOnDeck = gridMode === 'onDeck';
  const isWantToRead = gridMode === 'wantToRead';
  const isPersonalShelf = isOnDeck || isWantToRead;
  const showSortChips = gridMode === 'library';
  const [searchOpen, setSearchOpen] = useState(false);
  const [series, setSeries] = useState<SeriesDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<LibrarySortMode>('name');
  const [loadingMore, setLoadingMore] = useState(false);
  const hasSeriesRef = useRef(false);
  const pageRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const loadRequestRef = useRef(0);
  const endReachedReadyRef = useRef(false);
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
  const [listGeneration, setListGeneration] = useState(0);
  const seriesRowsRef = useRef<SeriesRow[]>([]);

  useEffect(() => {
    const cancel = () => {
      loadRequestRef.current += 1;
    };
    const blurSub = navigation.addListener('blur', cancel);
    const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
        return true;
      }
      return false;
    });
    return () => {
      cancel();
      blurSub();
      backSub.remove();
    };
  }, [navigation]);

  const fetchSeriesPage = useCallback(
    async (pageNumber: number, noCache: boolean) => {
      if (!client) {
        throw new Error('Not connected to a server. Go back and sign in again.');
      }
      if (isOnDeck) {
        return client.getOnDeckList(pageNumber, PAGE_SIZE, { noCache });
      }
      if (isWantToRead) {
        return client.getWantToReadList(pageNumber, PAGE_SIZE, { noCache });
      }
      if (isCollection) {
        return client.getSeriesByCollectionList(collectionId!, pageNumber, PAGE_SIZE, { noCache });
      }
      return client.getSeriesList(libraryId!, pageNumber, PAGE_SIZE, { noCache, sortBy });
    },
    [client, collectionId, isCollection, isOnDeck, isWantToRead, libraryId, sortBy]
  );

  const loadSeries = useCallback(async (options?: { refresh?: boolean; reset?: boolean; page?: number; append?: boolean }) => {
    const isRefresh = options?.refresh === true;
    const isReset = options?.reset === true;
    const append = options?.append === true;
    const pageNumber = options?.page ?? 0;

    if (gridMode === 'library' && libraryId == null) {
      setError('Missing library.');
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      loadingMoreRef.current = false;
      return;
    }
    if (gridMode === 'collection' && collectionId == null) {
      setError('Missing collection.');
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      loadingMoreRef.current = false;
      return;
    }

    if (append) {
      if (loadingMoreRef.current || !hasMoreRef.current || loading || refreshing) {
        return;
      }
      loadingMoreRef.current = true;
      setLoadingMore(true);
      try {
        const { result, pagination } = await fetchSeriesPage(pageNumber, false);
        const items = result.filter((s): s is SeriesDto => typeof s.id === 'number');
        hasMoreRef.current = hasMoreSeriesPages(pagination, items.length, PAGE_SIZE);
        pageRef.current = pageNumber;
        if (items.length > 0) {
          setSeries((prev) => mergeSeriesPages(prev, items));
        } else {
          hasMoreRef.current = false;
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load more series';
        setError(message);
        console.error('Failed to load more series:', err);
      } finally {
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }
      return;
    }

    if (!client) {
      setError('Not connected to a server. Go back and sign in again.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const requestId = ++loadRequestRef.current;
    endReachedReadyRef.current = false;

    setError(null);
    if (isReset) {
      setSeries([]);
      setSearchQuery('');
      setSearchOpen(false);
      setLoading(true);
      setListGeneration((g) => g + 1);
      pageRef.current = 0;
      hasMoreRef.current = true;
    } else if (isRefresh) {
      setRefreshing(true);
      pageRef.current = 0;
      hasMoreRef.current = true;
    } else if (!hasSeriesRef.current) {
      setLoading(true);
      pageRef.current = 0;
      hasMoreRef.current = true;
    }

    try {
      const { result, pagination } = await fetchSeriesPage(pageNumber, isReset || isRefresh);
      const items = result.filter((s): s is SeriesDto => typeof s.id === 'number');

      if (requestId !== loadRequestRef.current) {
        return;
      }

      hasMoreRef.current = hasMoreSeriesPages(pagination, items.length, PAGE_SIZE);
      pageRef.current = pageNumber;
      setSeries(items);

      if (items.length === 0) {
        const emptyMessage = describeEmptyLibraryLoad(pagination, { isCollection });
        if (emptyMessage) {
          setError(emptyMessage);
        }
      }
    } catch (err: unknown) {
      if (requestId !== loadRequestRef.current) {
        return;
      }
      const message = err instanceof Error ? err.message : 'Failed to load series';
      setError(message);
      console.error('Failed to load series:', err);
    } finally {
      if (requestId === loadRequestRef.current) {
        setLoading(false);
        setRefreshing(false);
        endReachedReadyRef.current = true;
      }
    }
  }, [client, fetchSeriesPage, loading, refreshing]);

  const loadSeriesRef = useRef(loadSeries);
  loadSeriesRef.current = loadSeries;

  useEffect(() => {
    loadSeriesRef.current();
  }, [libraryId, collectionId, sortBy, gridMode]);

  const handleRefresh = useCallback(() => {
    loadSeriesRef.current({ refresh: true, page: 0 });
  }, []);

  const handleFullReset = useCallback(() => {
    loadSeriesRef.current({ reset: true, page: 0 });
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!endReachedReadyRef.current || loadingMoreRef.current || !hasMoreRef.current || loading || refreshing) {
      return;
    }
    loadSeriesRef.current({ append: true, page: pageRef.current + 1 });
  }, [loading, refreshing]);

  const onMomentumScrollBegin = useCallback(() => {
    endReachedReadyRef.current = true;
  }, []);

  useLibraryReloadOnFocus(handleFullReset);

  const toggleSearch = useCallback(() => {
    setSearchOpen((open) => {
      if (open) {
        setSearchQuery('');
        Keyboard.dismiss();
      }
      return !open;
    });
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: libraryName,
      headerRight: () => (
        <ScreenHeaderActions
          navigation={navigation}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          showSettings={false}
          searchActive={searchOpen}
          onSearchPress={toggleSearch}
        />
      ),
    });
  }, [navigation, libraryName, handleRefresh, refreshing, searchOpen, toggleSearch]);

  const getCoverUrl = useCallback((seriesId: number) => {
    if (!client) return '';
    return client.getCoverImageUrl(seriesId);
  }, [client]);

  const displayedSeries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return series;
    }
    return series.filter((s) => s.name?.toLowerCase().includes(query));
  }, [series, searchQuery]);

  /** Chunk series into rows for stable FlatList layout (column count follows orientation). */
  const seriesRows = useMemo(
    () => chunkIntoRows(displayedSeries, gridMetrics.columns),
    [displayedSeries, gridMetrics.columns]
  );

  seriesRowsRef.current = seriesRows;

  const clientRef = useRef(client);
  clientRef.current = client;

  const onViewableRowsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<SeriesRow>[] }) => {
      const activeClient = clientRef.current;
      if (!activeClient) return;

      const rows = seriesRowsRef.current;
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

      const prefetch = (items: SeriesDto[]) => {
        items.forEach((item) => {
          const url = activeClient.getCoverImageUrl(item.id);
          if (url) {
            void Image.prefetch(url);
          }
        });
      };

      prefetch(visible);

      if (maxRowIndex >= 0) {
        const ahead: SeriesDto[] = [];
        for (let row = maxRowIndex + 1; row <= maxRowIndex + 3 && row < rows.length; row += 1) {
          ahead.push(...rows[row]);
        }
        prefetch(ahead);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 15 }).current;

  useEffect(() => {
    if (seriesRows.length === 0 || !client) return;
    seriesRows.slice(0, 6).flat().forEach((item) => {
      const url = client.getCoverImageUrl(item.id);
      if (url) {
        void Image.prefetch(url);
      }
    });
  }, [seriesRows.length, client]);

  const handleRemoveFromOnDeck = useCallback(
    (item: SeriesDto) => {
      if (!client) return;
      Alert.alert(
        'Remove from On Deck',
        `Remove "${item.name}" from On Deck until you read it again?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              void (async () => {
                try {
                  await client.removeFromOnDeck(item.id);
                  setSeries((prev) => prev.filter((s) => s.id !== item.id));
                } catch (err: unknown) {
                  const message = err instanceof Error ? err.message : 'Failed to remove from On Deck';
                  setError(message);
                }
              })();
            },
          },
        ]
      );
    },
    [client]
  );

  const handleSeriesPress = useCallback((item: SeriesDto) => {
    navigation.navigate('SeriesDetail', {
      seriesId: item.id,
      seriesName: item.name,
      seriesSummary: item.summary || undefined,
    });
  }, [navigation]);

  const renderSeriesRow = useCallback(({ item: row }: { item: SeriesRow }) => (
    <View style={[styles.row, { height: gridMetrics.rowHeight - gridMetrics.gap, marginBottom: gridMetrics.gap, gap: gridMetrics.gap }]}>
      {row.map((item) => (
        <SeriesCard
          key={item.id}
          item={item}
          coverUrl={getCoverUrl(item.id)}
          onPress={handleSeriesPress}
          onLongPress={isOnDeck ? handleRemoveFromOnDeck : undefined}
          theme={theme}
          placeholderColor={theme.border}
          cardWidth={gridMetrics.cardWidth}
          coverHeight={gridMetrics.coverHeight}
          infoHeight={gridMetrics.infoHeight}
        />
      ))}
      {row.length < gridMetrics.columns
        ? Array.from({ length: gridMetrics.columns - row.length }, (_, i) => (
            <View key={`spacer-${i}`} style={{ width: gridMetrics.cardWidth }} />
          ))
        : null}
    </View>
  ), [getCoverUrl, handleSeriesPress, handleRemoveFromOnDeck, isOnDeck, theme, gridMetrics]);

  const rowKeyExtractor = useCallback(
    (row: SeriesRow) => row.map((item) => item.id).join('-'),
    []
  );

  const getRowLayout = useCallback(
    (_: ArrayLike<SeriesRow> | null | undefined, index: number) => ({
      length: gridMetrics.rowHeight,
      offset: gridMetrics.rowHeight * index,
      index,
    }),
    [gridMetrics.rowHeight]
  );

  const renderListFooter = useCallback(() => {
    if (!loadingMore) {
      return null;
    }
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }, [loadingMore, theme.primary]);

  const emptyShelfMessage = useMemo(() => {
    if (isOnDeck) return 'Nothing on deck — start reading a series to see it here.';
    if (isWantToRead) return 'No series marked Want to Read on your Kavita server.';
    return `${libraryName} appears empty on the server.`;
  }, [isOnDeck, isWantToRead, libraryName]);

  const showInitialLoader = loading && series.length === 0;
  const showInitialError = !loading && error != null && series.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {error ? (
        <Text variant="bodySmall" style={[styles.errorBanner, { color: theme.error }]}>
          {error}
        </Text>
      ) : null}

      {isCollection && !compactLayout ? (
        <Text variant="bodySmall" style={[styles.collectionHint, { color: theme.textSecondary }]}>
          Kavita collection tag — can include series from any library. Use Libraries above for per-library views.
        </Text>
      ) : null}

      {isOnDeck && !compactLayout ? (
        <Text variant="bodySmall" style={[styles.collectionHint, { color: theme.textSecondary }]}>
          Continue reading — long-press a series to remove from On Deck.
        </Text>
      ) : null}

      {searchOpen ? (
        <Searchbar
          placeholder={
            isPersonalShelf ? 'Search shelf...' : isCollection ? 'Search collection...' : 'Search in library...'
          }
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchBarCompact, { backgroundColor: theme.surface }]}
          onBlur={() => Keyboard.dismiss()}
          iconColor={theme.textSecondary}
          placeholderTextColor={theme.textTertiary}
          inputStyle={{ color: theme.text }}
          autoFocus
        />
      ) : null}

      {showSortChips ? (
      <View style={[styles.filterRow, compactLayout && styles.filterRowCompact]}>
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
      ) : null}

      {showInitialLoader ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading series...</Text>
        </View>
      ) : showInitialError ? (
        <View style={styles.centerContainer}>
          <Text variant="titleLarge" style={{ color: theme.text, textAlign: 'center' }}>
            Could not load library
          </Text>
          <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.textSecondary }]}>
            {error}
          </Text>
          <Button mode="contained" onPress={() => loadSeriesRef.current()} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      ) : displayedSeries.length === 0 ? (
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
                ? emptyShelfMessage
                : 'No matches for your search.'}
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          key={`${listGeneration}-${gridMetrics.columns}`}
          data={seriesRows}
          renderItem={renderSeriesRow}
          keyExtractor={rowKeyExtractor}
          style={styles.list}
          contentContainerStyle={[styles.gridContent, compactLayout && styles.gridContentCompact]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android' ? false : undefined}
          getItemLayout={getRowLayout}
          onViewableItemsChanged={onViewableRowsChanged}
          viewabilityConfig={viewabilityConfig}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.35}
          onMomentumScrollBegin={onMomentumScrollBegin}
          ListFooterComponent={renderListFooter}
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
  searchBarCompact: {
    marginHorizontal: 8,
    marginTop: 4,
    marginBottom: 4,
    elevation: 0,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterRowCompact: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  chip: {
  },
  list: {
    flex: 1,
  },
  gridContent: {
    padding: 16,
  },
  gridContentCompact: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  card: {
    elevation: 2,
    overflow: 'hidden',
    height: '100%',
  },
  coverFrame: {
    width: '100%',
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
  },
  cardInfo: {
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
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
