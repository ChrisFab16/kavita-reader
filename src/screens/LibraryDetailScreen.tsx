// src/screens/LibraryDetailScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Dimensions, Keyboard, RefreshControl, ScrollView } from 'react-native';
import { Text, ActivityIndicator, Card, Searchbar, Chip, Button } from 'react-native-paper';
import { Image } from 'expo-image';
import { useServerStore } from '../stores/serverStore';
import { useAppTheme } from '../hooks/useAppTheme';
import { SeriesDto } from '../types/kavita';
import { formatSeriesListSubtitle, seriesProgressPercent } from '../utils/seriesInfo';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'LibraryDetail'>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
const PAGE_SIZE = 100;

export default function LibraryDetailScreen({ route, navigation }: Props) {
  const { libraryId, libraryName } = route.params;
  const [series, setSeries] = useState<SeriesDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'recent'>('name');

  const client = useServerStore((state) => state.getActiveClient());
  const theme = useAppTheme();

  const loadSeries = useCallback(async (options?: { refresh?: boolean }) => {
    const isRefresh = options?.refresh === true;

    if (!client) {
      setError('Not connected to a server. Go back and sign in again.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setError(null);
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await client.getSeries(libraryId, 0, PAGE_SIZE);
      setSeries(response.filter((s): s is SeriesDto => typeof s.id === 'number'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load series';
      setError(message);
      console.error('Failed to load series:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [client, libraryId]);

  useEffect(() => {
    loadSeries();
  }, [loadSeries]);

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

  const renderSeriesCard = useCallback(({ item }: { item: SeriesDto }) => {
    const progress = seriesProgressPercent(item);
    const subtitle = formatSeriesListSubtitle(item);

    return (
      <TouchableOpacity
        style={styles.seriesCard}
        onPress={() => navigation.navigate('SeriesDetail', { seriesId: item.id })}
      >
        <Card style={[styles.card, { backgroundColor: theme.surface }]}>
          <Image
            source={{ uri: getCoverUrl(item.id) }}
            style={styles.cover}
            contentFit="cover"
            transition={200}
          />
          <Card.Content style={styles.cardInfo}>
            <Text variant="bodyMedium" numberOfLines={2} style={[styles.seriesTitle, { color: theme.text }]}>
              {item.name}
            </Text>
            {subtitle ? (
              <Text variant="bodySmall" style={[styles.seriesInfo, { color: theme.textSecondary }]}>
                {subtitle}
              </Text>
            ) : null}
            {progress > 0 && (
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
            )}
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  }, [getCoverUrl, navigation, theme]);

  const keyExtractor = useCallback((item: SeriesDto) => String(item.id), []);

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
          data={sortedSeries}
          renderItem={renderSeriesCard}
          keyExtractor={keyExtractor}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.row}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={12}
          maxToRenderPerBatch={8}
          windowSize={7}
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
  gridContent: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  seriesCard: {
    width: CARD_WIDTH,
    marginBottom: 16,
  },
  card: {
    elevation: 2,
  },
  cover: {
    width: '100%',
    height: CARD_WIDTH * 1.5,
    backgroundColor: '#E0E0E0',
  },
  cardInfo: {
    paddingTop: 8,
  },
  seriesTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  seriesInfo: {
    marginBottom: 4,
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
