import React, { memo } from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { Image } from 'expo-image';
import type { SeriesDto } from '../types/kavita';
import { formatSeriesListSubtitle, seriesProgressPercent } from '../utils/seriesInfo';
import { BROWSE_COVER_ASPECT } from '../utils/responsiveLayout';
import type { Theme } from '../utils/theme';

export type SeriesCardProps = {
  item: SeriesDto;
  coverUrl: string;
  onPress: (item: SeriesDto) => void;
  onLongPress?: (item: SeriesDto) => void;
  theme: Theme;
  placeholderColor: string;
  cardWidth?: number;
  coverHeight?: number;
  infoHeight: number;
  /** Size to parent flex slot; cover uses aspect ratio instead of fixed height. */
  fillSlot?: boolean;
  /** Landscape grid: title on cover scrim, no subtitle block below. */
  compact?: boolean;
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
  fillSlot = false,
  compact = false,
}: SeriesCardProps) {
  const progress = seriesProgressPercent(item);
  const subtitle = formatSeriesListSubtitle(item);
  const coverAspectRatio = 1 / BROWSE_COVER_ASPECT;

  const progressBar =
    progress > 0 ? (
      <View
        style={[
          styles.progressBar,
          compact ? styles.progressBarCompact : { backgroundColor: theme.border },
        ]}
      >
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
    ) : null;

  return (
    <TouchableOpacity
      style={
        fillSlot
          ? styles.fillSlotTouchable
          : { width: cardWidth!, height: coverHeight! + infoHeight }
      }
      onPress={() => onPress(item)}
      onLongPress={onLongPress ? () => onLongPress(item) : undefined}
      activeOpacity={0.7}
    >
      <Card style={[styles.card, compact && styles.cardCompact, { backgroundColor: theme.surface }]}>
        <View
          style={[
            styles.coverFrame,
            { backgroundColor: placeholderColor },
            fillSlot
              ? { width: '100%', aspectRatio: coverAspectRatio }
              : { height: coverHeight },
          ]}
        >
          <Image
            source={{ uri: coverUrl }}
            style={fillSlot ? styles.coverFill : [styles.cover, { height: coverHeight }]}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={0}
            recyclingKey={String(item.id)}
          />
          {compact ? (
            <View style={styles.titleScrim}>
              <Text numberOfLines={3} style={styles.overlayTitle}>
                {item.name}
              </Text>
              {progressBar}
            </View>
          ) : null}
        </View>
        {!compact ? (
          <Card.Content style={[styles.cardInfo, { height: infoHeight }]}>
            <Text variant="bodyMedium" numberOfLines={2} style={[styles.seriesTitle, { color: theme.text }]}>
              {item.name}
            </Text>
            <Text variant="bodySmall" numberOfLines={1} style={[styles.seriesInfo, { color: theme.textSecondary }]}>
              {subtitle || ' '}
            </Text>
            <View style={styles.progressSlot}>{progressBar}</View>
          </Card.Content>
        ) : null}
      </Card>
    </TouchableOpacity>
  );
});

export default SeriesCard;

const styles = StyleSheet.create({
  fillSlotTouchable: {
    width: '100%',
  },
  card: {
    elevation: 2,
    overflow: 'hidden',
  },
  cardCompact: {
    elevation: 1,
  },
  coverFrame: {
    width: '100%',
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
  },
  coverFill: {
    ...StyleSheet.absoluteFillObject,
  },
  titleScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 5,
    paddingTop: 6,
    paddingBottom: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  overlayTitle: {
    color: '#fff',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  cardInfo: {
    paddingVertical: 8,
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
  progressBarCompact: {
    marginTop: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  progressFill: {
    height: '100%',
  },
});
