// src/screens/ReaderScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { useServerStore } from '../stores/serverStore';
import { useAppTheme } from '../hooks/useAppTheme';
import { detectReaderKind } from '../utils/readerKind';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import ImageReaderScreen from './ImageReaderScreen';
import EpubReaderScreen from './EpubReaderScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'Reader'>;

export default function ReaderScreen({ route, navigation }: Props) {
  const { chapterId, chapterFormat, fileName } = route.params;
  const [loading, setLoading] = useState(true);
  const [isEpub, setIsEpub] = useState(false);

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

  useEffect(() => {
    let cancelled = false;

    async function resolveReader() {
      if (!client) return;

      try {
        const kind = await detectReaderKind(client, chapterId, {
          format: chapterFormat,
          fileName,
        });
        if (!cancelled) {
          setIsEpub(kind === 'epub');
          setLoading(false);
        }
      } catch (error: unknown) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to detect reader type:', error);
        Alert.alert('Error', `Failed to open chapter: ${message}`);
        navigation.goBack();
      }
    }

    resolveReader();

    return () => {
      cancelled = true;
    };
  }, [client, chapterId, chapterFormat, fileName, navigation]);

  if (!client || loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Loading chapter...
        </Text>
      </View>
    );
  }

  if (isEpub) {
    return <EpubReaderScreen route={route} navigation={navigation} />;
  }

  return <ImageReaderScreen route={route} navigation={navigation} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
});
