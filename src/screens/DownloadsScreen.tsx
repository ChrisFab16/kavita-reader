import React, { useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Button, ProgressBar, IconButton } from 'react-native-paper';
import { useAppTheme } from '../hooks/useAppTheme';
import { useDownloadStore, type DownloadJob } from '../stores/downloadStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Downloads'>;

function statusLabel(status: DownloadJob['status']): string {
  switch (status) {
    case 'queued':
      return 'Queued';
    case 'waitingForWifi':
      return 'Waiting for Wi‑Fi';
    case 'downloading':
      return 'Downloading';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

export default function DownloadsScreen(_props: Props) {
  const theme = useAppTheme();
  const jobs = useDownloadStore((state) => state.jobs);
  const cancelJob = useDownloadStore((state) => state.cancelJob);
  const retryJob = useDownloadStore((state) => state.retryJob);
  const removeJob = useDownloadStore((state) => state.removeJob);

  const renderItem = useCallback(
    ({ item }: { item: DownloadJob }) => (
      <View style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.rowMain}>
          <Text variant="titleSmall" style={{ color: theme.text }} numberOfLines={2}>
            {item.title}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
            {statusLabel(item.status)}
            {item.totalPages > 0 && item.status === 'downloading'
              ? ` · ${Math.round(item.progress * 100)}%`
              : ''}
          </Text>
          {item.errorMessage ? (
            <Text variant="bodySmall" style={{ color: theme.error }}>
              {item.errorMessage}
            </Text>
          ) : null}
          {item.status === 'downloading' ? (
            <ProgressBar progress={item.progress} color={theme.primary} style={styles.progress} />
          ) : null}
        </View>
        <View style={styles.actions}>
          {item.status === 'downloading' || item.status === 'queued' ? (
            <IconButton icon="close" size={20} onPress={() => cancelJob(item.id)} iconColor={theme.textSecondary} />
          ) : null}
          {item.status === 'failed' ? (
            <IconButton icon="refresh" size={20} onPress={() => retryJob(item.id)} iconColor={theme.primary} />
          ) : null}
          {item.status === 'completed' || item.status === 'failed' || item.status === 'cancelled' ? (
            <IconButton
              icon="delete-outline"
              size={20}
              onPress={() => void removeJob(item.id)}
              iconColor={theme.error}
            />
          ) : null}
        </View>
      </View>
    ),
    [theme, cancelJob, retryJob, removeJob]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {jobs.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="titleMedium" style={{ color: theme.text }}>
            No downloads yet
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 8 }}>
            Long-press an album on a series page and choose Download for offline reading.
          </Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  rowMain: {
    flex: 1,
    gap: 4,
  },
  progress: {
    marginTop: 8,
    height: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
});
