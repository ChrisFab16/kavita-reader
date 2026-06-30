// src/screens/SettingsScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Card, Switch, Button, IconButton, Divider, List, Chip } from 'react-native-paper';
import { useServerStore } from '../stores/serverStore';
import { useThemeStore } from '../stores/themeStore';
import { useLibraryDisplayStore } from '../stores/libraryDisplayStore';
import { useReaderSettingsStore, type PrefetchPagesOption } from '../stores/readerSettingsStore';
import type { FitModePreference } from '../utils/readerFit';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const servers = useServerStore((state) => state.servers);
  const primaryServerId = useServerStore((state) => state.primaryServerId);
  const setPrimaryServer = useServerStore((state) => state.setPrimaryServer);
  const removeServer = useServerStore((state) => state.removeServer);
  
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const toggleDarkMode = useThemeStore((state) => state.toggleDarkMode);
  const isGrayscaleReading = useThemeStore((state) => state.isGrayscaleReading);
  const toggleGrayscaleReading = useThemeStore((state) => state.toggleGrayscaleReading);
  const pageTurnSoundsEnabled = useThemeStore((state) => state.pageTurnSoundsEnabled);
  const togglePageTurnSounds = useThemeStore((state) => state.togglePageTurnSounds);
  const theme = useThemeStore((state) => state.theme);

  const [expandedServers, setExpandedServers] = useState(false);
  const requestFullReload = useLibraryDisplayStore((state) => state.requestFullReload);
  const isResettingLibrary = useLibraryDisplayStore((state) => state.isResetting);

  const fitModePreference = useReaderSettingsStore((state) => state.fitModePreference);
  const setFitModePreference = useReaderSettingsStore((state) => state.setFitModePreference);
  const prefetchPages = useReaderSettingsStore((state) => state.prefetchPages);
  const setPrefetchPages = useReaderSettingsStore((state) => state.setPrefetchPages);
  const cacheEntireAlbum = useReaderSettingsStore((state) => state.cacheEntireAlbum);
  const setCacheEntireAlbum = useReaderSettingsStore((state) => state.setCacheEntireAlbum);
  const downloadOnMobileData = useReaderSettingsStore((state) => state.downloadOnMobileData);
  const setDownloadOnMobileData = useReaderSettingsStore((state) => state.setDownloadOnMobileData);

  const fitModeOptions: { id: FitModePreference; label: string }[] = [
    { id: 'auto', label: 'Auto' },
    { id: 'fitScreen', label: 'Fit screen' },
    { id: 'fitWidth', label: 'Fit width' },
    { id: 'fitHeight', label: 'Fit height' },
  ];

  const prefetchOptions: { value: PrefetchPagesOption; label: string }[] = [
    { value: 0, label: 'Off' },
    { value: 2, label: '2 pages' },
    { value: 5, label: '5 pages' },
  ];

  const handleResetLibraryData = () => {
    Alert.alert(
      'Reset & reload libraries',
      'Clears cached covers and reloads library data from your Kavita server. Use this after moving or removing comics from a library.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset & reload',
          onPress: async () => {
            await requestFullReload();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          },
        },
      ]
    );
  };

  const handleRemoveServer = (serverId: string, serverName: string) => {
    Alert.alert(
      'Remove Server',
      `Are you sure you want to remove "${serverName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            removeServer(serverId);
            if (servers.length === 1) {
              // Last server removed, go back to connect screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'Connect' }],
              });
            }
          }
        },
      ]
    );
  };

  const handleAddServer = () => {
    navigation.navigate('Connect');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout from all servers?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            // Remove all servers
            servers.forEach(server => removeServer(server.id));
            navigation.reset({
              index: 0,
              routes: [{ name: 'Connect' }],
            });
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        {/* App Info */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={[styles.headerTitle, { color: theme.text }]}>
            Settings
          </Text>
        </View>

        {/* Appearance Settings */}
        <Card style={[styles.card, { backgroundColor: theme.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text }]}>
              Appearance
            </Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="bodyLarge" style={{ color: theme.text }}>
                  Dark Mode
                </Text>
                <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                  Use dark theme throughout the app
                </Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                color={theme.primary}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Reading Settings */}
        <Card style={[styles.card, { backgroundColor: theme.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text }]}>
              Reading
            </Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="bodyLarge" style={{ color: theme.text }}>
                  Grayscale Mode
                </Text>
                <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                  Reduce eye strain with grayscale filter
                </Text>
              </View>
              <Switch
                value={isGrayscaleReading}
                onValueChange={toggleGrayscaleReading}
                color={theme.primary}
              />
            </View>

            <Divider style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="bodyLarge" style={{ color: theme.text }}>
                  Page Turn Sounds
                </Text>
                <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                  Play sound when turning pages
                </Text>
              </View>
              <Switch
                value={pageTurnSoundsEnabled}
                onValueChange={togglePageTurnSounds}
                color={theme.primary}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Reader cache & prefetch */}
        <Card style={[styles.card, { backgroundColor: theme.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text }]}>
              Reader cache
            </Text>
            <Text variant="bodySmall" style={[styles.settingDescription, { color: theme.textSecondary }]}>
              Prefetch upcoming pages into the image cache while you read. Offline downloads are separate (long-press an album).
            </Text>

            <Text variant="labelLarge" style={{ color: theme.text, marginBottom: 8 }}>
              Page fit
            </Text>
            <View style={styles.chipRow}>
              {fitModeOptions.map((option) => (
                <Chip
                  key={option.id}
                  selected={fitModePreference === option.id}
                  onPress={() => setFitModePreference(option.id)}
                  style={styles.settingChip}
                >
                  {option.label}
                </Chip>
              ))}
            </View>

            <Divider style={[styles.divider, { backgroundColor: theme.border }]} />

            <Text variant="labelLarge" style={{ color: theme.text, marginBottom: 8 }}>
              Prefetch ahead
            </Text>
            <View style={styles.chipRow}>
              {prefetchOptions.map((option) => (
                <Chip
                  key={option.value}
                  selected={prefetchPages === option.value}
                  onPress={() => setPrefetchPages(option.value)}
                  style={styles.settingChip}
                >
                  {option.label}
                </Chip>
              ))}
            </View>

            <Divider style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="bodyLarge" style={{ color: theme.text }}>
                  Cache entire album
                </Text>
                <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                  Warm all pages when you open a chapter (uses more storage and data)
                </Text>
              </View>
              <Switch
                value={cacheEntireAlbum}
                onValueChange={setCacheEntireAlbum}
                color={theme.primary}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Offline downloads */}
        <Card style={[styles.card, { backgroundColor: theme.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text }]}>
              Offline downloads
            </Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="bodyLarge" style={{ color: theme.text }}>
                  Download on mobile data
                </Text>
                <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                  Allow offline album downloads on cellular (default: Wi‑Fi only when detection is available)
                </Text>
              </View>
              <Switch
                value={downloadOnMobileData}
                onValueChange={setDownloadOnMobileData}
                color={theme.primary}
              />
            </View>

            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Downloads')}
              icon="download"
              style={styles.resetLibraryButton}
              textColor={theme.primary}
            >
              Open download queue
            </Button>
          </Card.Content>
        </Card>

        {/* Library data */}
        <Card style={[styles.card, { backgroundColor: theme.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text }]}>
              Library data
            </Text>
            <Text variant="bodySmall" style={[styles.settingDescription, { color: theme.textSecondary }]}>
              Clears cached covers and reloads from the server. Use after comics move off a library or selection changes on Kavita.
            </Text>
            <Button
              mode="outlined"
              onPress={handleResetLibraryData}
              icon="refresh"
              loading={isResettingLibrary}
              disabled={isResettingLibrary}
              style={styles.resetLibraryButton}
              textColor={theme.primary}
            >
              Reset & reload libraries
            </Button>
          </Card.Content>
        </Card>

        {/* Servers */}
        <Card style={[styles.card, { backgroundColor: theme.surface }]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text }]}>
                Servers ({servers.length})
              </Text>
              <IconButton
                icon={expandedServers ? 'chevron-up' : 'chevron-down'}
                size={20}
                onPress={() => setExpandedServers(!expandedServers)}
                iconColor={theme.textSecondary}
              />
            </View>

            {expandedServers && (
              <>
                {servers.map((server, index) => (
                  <View key={server.id}>
                    {index > 0 && <Divider style={[styles.divider, { backgroundColor: theme.border }]} />}
                    <View style={styles.serverRow}>
                      <View style={styles.serverInfo}>
                        <View style={styles.serverTitleRow}>
                          <Text variant="bodyLarge" style={{ color: theme.text }}>
                            {server.name}
                          </Text>
                          {server.id === primaryServerId && (
                            <Chip 
                              style={[styles.primaryChip, { backgroundColor: theme.primaryLight }]}
                              textStyle={{ color: '#fff', fontSize: 11 }}
                              compact
                            >
                              Primary
                            </Chip>
                          )}
                        </View>
                        <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                          {server.url.replace(/^https?:\/\//, '')}
                        </Text>
                      </View>
                      <View style={styles.serverActions}>
                        {server.id !== primaryServerId && (
                          <IconButton
                            icon="star-outline"
                            size={20}
                            onPress={() => setPrimaryServer(server.id)}
                            iconColor={theme.textSecondary}
                          />
                        )}
                        <IconButton
                          icon="delete-outline"
                          size={20}
                          onPress={() => handleRemoveServer(server.id, server.name)}
                          iconColor={theme.error}
                        />
                      </View>
                    </View>
                  </View>
                ))}

                <Divider style={[styles.divider, { backgroundColor: theme.border }]} />

                <Button
                  mode="outlined"
                  onPress={handleAddServer}
                  icon="plus"
                  style={styles.addServerButton}
                  textColor={theme.primary}
                >
                  Add Another Server
                </Button>
              </>
            )}
          </Card.Content>
        </Card>

        {/* About */}
        <Card style={[styles.card, { backgroundColor: theme.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text }]}>
              About
            </Text>
            
            <View style={styles.aboutRow}>
              <Text variant="bodyMedium" style={{ color: theme.textSecondary }}>
                Version
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.text }}>
                1.0.0
              </Text>
            </View>

            <View style={styles.aboutRow}>
              <Text variant="bodyMedium" style={{ color: theme.textSecondary }}>
                Connected Servers
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.text }}>
                {servers.length}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Logout */}
        <Card style={[styles.card, { backgroundColor: theme.surface }]}>
          <Card.Content>
            <Button
              mode="contained"
              onPress={handleLogout}
              buttonColor={theme.error}
              textColor="#fff"
              icon="logout"
            >
              Logout from All Servers
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontWeight: '600',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    gap: 4,
  },
  settingDescription: {
    marginBottom: 12,
  },
  resetLibraryButton: {
    alignSelf: 'flex-start',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  settingChip: {
    marginVertical: 2,
  },
  divider: {
    marginVertical: 12,
  },
  serverRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  serverInfo: {
    flex: 1,
    gap: 4,
  },
  serverTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryChip: {
    height: 20,
  },
  serverActions: {
    flexDirection: 'row',
  },
  addServerButton: {
    marginTop: 8,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  bottomSpacer: {
    height: 24,
  },
});