import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, useWindowDimensions } from 'react-native';
import { Text, Card, ActivityIndicator, Searchbar, IconButton, Chip } from 'react-native-paper';
import type { SeriesGridMode } from '../types/kavita';
import { useServerStore } from '../stores/serverStore';
import { useThemeStore } from '../stores/themeStore';
import { createScreenLogger } from '../utils/debugLogger';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import ScreenHeaderActions from '../components/ScreenHeaderActions';
import { useLibraryReloadOnFocus } from '../hooks/useLibraryReloadOnFocus';
import { getHomeCardWidth, isLandscape } from '../utils/responsiveLayout';
import type { CollectionTagDto } from '../types/kavita';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

type HomeShelf = 'onDeck' | 'libraries' | 'collections' | 'wantToRead';

const HOME_SHELVES: { id: HomeShelf; label: string; gridMode?: SeriesGridMode; screenTitle: string }[] = [
  { id: 'onDeck', label: 'On Deck', gridMode: 'onDeck', screenTitle: 'On Deck' },
  { id: 'libraries', label: 'Libraries' },
  { id: 'collections', label: 'Collections' },
  { id: 'wantToRead', label: 'Want to Read', gridMode: 'wantToRead', screenTitle: 'Want to Read' },
];

const logger = createScreenLogger('HomeScreen');

export default function HomeScreen({ navigation }: Props) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const libraryCardWidth = getHomeCardWidth(windowWidth);
  const compactLayout = isLandscape(windowWidth, windowHeight);
  const [searchOpen, setSearchOpen] = useState(false);
  const lastRenderReason = useRef<string>('initial');
  
  logger.render(lastRenderReason.current);
  
  const [libraries, setLibraries] = useState<any[]>(() => {
    logger.state('Initializing libraries', []);
    return [];
  });
  
  const [loading, setLoading] = useState<boolean>(() => {
    logger.state('Initializing loading', true);
    return true;
  });

  const [refreshing, setRefreshing] = useState(false);

  const [collections, setCollections] = useState<CollectionTagDto[]>([]);
  
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    logger.state('Initializing searchQuery', '');
    return '';
  });

  const [activeShelf, setActiveShelf] = useState<HomeShelf>('libraries');
  const defaultShelfChecked = useRef(false);
  
  logger.state('Current state', { 
    librariesCount: libraries.length, 
    loading, 
    searchQuery 
  });
  
  logger.store('serverStore', 'Calling useServerStore...');
  const client = useServerStore((state) => {
    logger.store('serverStore', 'Selector executing');
    return state.getActiveClient();
  });
  logger.store('serverStore', `Client retrieved: ${!!client}`);
  
  logger.store('themeStore', 'Calling useThemeStore...');
  const theme = useThemeStore((state) => {
    logger.store('themeStore', 'Selector executing');
    return state.theme;
  });
  logger.store('themeStore', `Theme retrieved: ${theme ? Object.keys(theme).length + ' keys' : 'null'}`);

  const loadLibraries = useCallback(async (options?: { refresh?: boolean; reset?: boolean }) => {
    logger.function('loadLibraries', 'Called');

    if (!client) {
      logger.error('No client available');
      return;
    }

    const isReset = options?.reset === true;
    const isRefresh = options?.refresh === true;
    if (isReset) {
      setLibraries([]);
      setCollections([]);
      setSearchQuery('');
      setSearchOpen(false);
      setLoading(true);
      lastRenderReason.current = 'reset-started';
    } else if (isRefresh) {
      setRefreshing(true);
    } else {
      logger.function('loadLibraries', 'Setting loading=true');
      setLoading(true);
      lastRenderReason.current = 'loading-started';
    }

    try {
      logger.function('loadLibraries', 'Calling client.getLibraries()');
      const [libs, colls] = await Promise.all([
        client.getLibraries(),
        client.getCollections().catch(() => [] as CollectionTagDto[]),
      ]);
      logger.success(`Libraries received: ${libs.length}, collections: ${colls.length}`);
      setLibraries(libs);
      setCollections(colls);
      lastRenderReason.current = 'libraries-loaded';
    } catch (error: any) {
      logger.error('Failed to load libraries', error.message);
      lastRenderReason.current = 'error';
    } finally {
      setLoading(false);
      setRefreshing(false);
      lastRenderReason.current = 'loading-complete';
      logger.function('loadLibraries', 'Complete');
      logger.separator();
    }
  }, [client]);

  useEffect(() => {
    logger.effect('Mount effect triggered');
    lastRenderReason.current = 'mount-effect';
    loadLibraries();
    return () => {
      logger.effect('Component unmounting');
    };
  }, [loadLibraries]);

  useEffect(() => {
    if (!client || defaultShelfChecked.current) return;
    defaultShelfChecked.current = true;
    void (async () => {
      try {
        const { result } = await client.getOnDeckList(0, 1);
        if (result.length > 0) {
          setActiveShelf('onDeck');
          navigation.navigate('LibraryDetail', {
            gridMode: 'onDeck',
            libraryName: 'On Deck',
          });
        }
      } catch {
        // On deck unavailable — stay on libraries
      }
    })();
  }, [client, navigation]);

  const openPersonalShelf = useCallback(
    (shelf: (typeof HOME_SHELVES)[number]) => {
      setActiveShelf(shelf.id);
      if (shelf.gridMode) {
        navigation.navigate('LibraryDetail', {
          gridMode: shelf.gridMode,
          libraryName: shelf.screenTitle ?? shelf.label,
        });
      }
    },
    [navigation]
  );

  const handleRefresh = useCallback(() => {
    loadLibraries({ refresh: true });
  }, [loadLibraries]);

  const handleFullReset = useCallback(() => {
    loadLibraries({ reset: true });
  }, [loadLibraries]);

  const toggleSearch = useCallback(() => {
    setSearchOpen((open) => {
      if (open) {
        setSearchQuery('');
      }
      return !open;
    });
  }, []);

  useLibraryReloadOnFocus(handleFullReset);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <ScreenHeaderActions
          navigation={navigation}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          searchActive={searchOpen}
          onSearchPress={toggleSearch}
        />
      ),
    });
  }, [navigation, handleRefresh, refreshing, searchOpen, toggleSearch]);

  const getLibraryIcon = (type: number) => {
    switch (type) {
      case 0: return 'book-open-page-variant';
      case 1: return 'book-open-variant';
      case 2: return 'book';
      default: return 'folder';
    }
  };

  const getLibraryTypeName = (type: number) => {
    switch (type) {
      case 0: return 'Manga';
      case 1: return 'Comic';
      case 2: return 'Book';
      default: return 'Library';
    }
  };

  logger.render_phase('Deciding which JSX to render');

  if (loading) {
    logger.render_phase('Rendering LOADING state');
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading your libraries...
        </Text>
      </View>
    );
  }

  logger.render_phase(`Rendering MAIN content (${libraries.length} libraries)`);

  const searchLower = searchQuery.trim().toLowerCase();
  const filteredLibraries = searchLower
    ? libraries.filter((library) => library.name?.toLowerCase().includes(searchLower))
    : libraries;
  const filteredCollections = searchLower
    ? collections.filter((collection) => collection.title?.toLowerCase().includes(searchLower))
    : collections;
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {searchOpen ? (
        <Searchbar
          placeholder={
            activeShelf === 'collections'
              ? 'Search collections...'
              : 'Search libraries...'
          }
          onChangeText={(text) => {
            logger.user('Search query changed', text);
            lastRenderReason.current = 'search-changed';
            setSearchQuery(text);
          }}
          value={searchQuery}
          style={[styles.searchBarCompact, { backgroundColor: theme.surface }]}
          iconColor={theme.textSecondary}
          placeholderTextColor={theme.textTertiary}
          inputStyle={{ color: theme.text }}
          autoFocus
        />
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.shelfChipRow}
        contentContainerStyle={styles.shelfChipContent}
      >
        {HOME_SHELVES.map((shelf) => (
          <Chip
            key={shelf.id}
            selected={activeShelf === shelf.id}
            onPress={() => openPersonalShelf(shelf)}
            style={[
              styles.shelfChip,
              {
                backgroundColor: activeShelf === shelf.id ? theme.primaryLight : theme.surface,
              },
            ]}
            textStyle={{ color: activeShelf === shelf.id ? '#fff' : theme.text }}
          >
            {shelf.label}
          </Chip>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        contentContainerStyle={compactLayout ? styles.contentCompact : undefined}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        <View style={[styles.section, compactLayout && styles.sectionCompact]}>
          {activeShelf === 'libraries' ? (
          <>
          <Text variant={compactLayout ? 'titleMedium' : 'titleLarge'} style={[styles.sectionTitle, compactLayout && styles.sectionTitleCompact, { color: theme.text }]}>
            Libraries
          </Text>
          
          {filteredLibraries.length === 0 ? (
            <Card style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
              <Card.Content>
                <Text variant="titleMedium" style={{ color: theme.text }}>
                  {libraries.length === 0 ? 'No libraries found' : 'No matching libraries'}
                </Text>
                <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.textSecondary }]}>
                  {libraries.length === 0
                    ? 'Add some libraries to your Kavita server to get started!'
                    : 'Try a different search term.'}
                </Text>
              </Card.Content>
            </Card>
          ) : (
            <View style={styles.librariesGrid}>
              {filteredLibraries.map((library, idx) => {
                if (logger.getRenderCount() <= 5) {
                  logger.render_phase(`Creating library card #${idx}: ${library.name}`);
                }
                return (
                  <TouchableOpacity
                    key={library.id}
                    style={[styles.libraryCard, { width: libraryCardWidth }]}
                    onPress={() => {
                      logger.user('Library clicked', library.name);
                      navigation.navigate('LibraryDetail', { 
                        libraryId: library.id, 
                        libraryName: library.name 
                      });
                    }}
                  >
                    <Card style={[styles.card, { backgroundColor: theme.surface }]}>
                      <Card.Content style={styles.cardContent}>
                        <IconButton
                          icon={getLibraryIcon(library.type)}
                          size={48}
                          iconColor={theme.primary}
                          style={styles.libraryIconButton}
                        />
                        <Text variant="titleMedium" style={[styles.libraryName, { color: theme.text }]} numberOfLines={2}>
                          {library.name}
                        </Text>
                        <Text variant="bodySmall" style={[styles.libraryType, { color: theme.textSecondary }]}>
                          {getLibraryTypeName(library.type)}
                        </Text>
                      </Card.Content>
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          </>
          ) : null}

          {activeShelf === 'collections' ? (
          <>
          <Text variant={compactLayout ? 'titleMedium' : 'titleLarge'} style={[styles.sectionTitle, compactLayout && styles.sectionTitleCompact, { color: theme.text }]}>
            Collections
          </Text>

          {filteredCollections.length === 0 ? (
            <Card style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
              <Card.Content>
                <Text variant="titleMedium" style={{ color: theme.text }}>
                  {collections.length === 0 ? 'No collections found' : 'No matching collections'}
                </Text>
                <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.textSecondary }]}>
                  {collections.length === 0
                    ? 'Create collections in Kavita to group series here.'
                    : 'Try a different search term.'}
                </Text>
              </Card.Content>
            </Card>
          ) : (
            <View style={styles.librariesGrid}>
              {filteredCollections.map((collection) => (
                <TouchableOpacity
                  key={collection.id}
                  style={[styles.libraryCard, { width: libraryCardWidth }]}
                  onPress={() => {
                    logger.user('Collection clicked', collection.title);
                    navigation.navigate('LibraryDetail', {
                      collectionId: collection.id,
                      libraryName: `${collection.title} (collection)`,
                    });
                  }}
                >
                  <Card style={[styles.card, { backgroundColor: theme.surface }]}>
                    <Card.Content style={styles.cardContent}>
                      <IconButton
                        icon="folder-multiple"
                        size={48}
                        iconColor={theme.primary}
                        style={styles.libraryIconButton}
                      />
                      <Text variant="titleMedium" style={[styles.libraryName, { color: theme.text }]} numberOfLines={2}>
                        {collection.title}
                      </Text>
                      <Text variant="bodySmall" style={[styles.libraryType, { color: theme.textSecondary }]}>
                        Collection tag
                      </Text>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}
          </>
          ) : null}

          {(activeShelf === 'onDeck' || activeShelf === 'wantToRead') ? (
            <Card style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
              <Card.Content>
                <Text variant="titleMedium" style={{ color: theme.text }}>
                  {activeShelf === 'onDeck' ? 'On Deck' : 'Want to Read'}
                </Text>
                <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.textSecondary }]}>
                  Tap the chip again to open your {activeShelf === 'onDeck' ? 'continue reading' : 'want to read'} shelf.
                </Text>
              </Card.Content>
            </Card>
          ) : null}
        </View>
      </ScrollView>
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
  },
  loadingText: {
    marginTop: 16,
  },
  searchBarCompact: {
    marginHorizontal: 8,
    marginTop: 4,
    marginBottom: 4,
    elevation: 0,
  },
  shelfChipRow: {
    maxHeight: 48,
    marginBottom: 4,
  },
  shelfChipContent: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
  },
  shelfChip: {
    marginVertical: 4,
  },
  content: {
    flex: 1,
  },
  contentCompact: {
    paddingTop: 0,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionCompact: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  sectionTitleCompact: {
    marginBottom: 6,
  },
  librariesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  libraryCard: {
  },
  card: {
    elevation: 2,
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  libraryIconButton: {
    margin: 0,
  },
  libraryName: {
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 8,
  },
  libraryType: {
  },
  emptyCard: {
    elevation: 2,
  },
  emptyText: {
    marginTop: 8,
  },
});