import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { SeriesDto } from '../types/kavita';
import type { Theme } from '../utils/theme';
import type { BrowseGridMetrics } from '../utils/responsiveLayout';
import SeriesCard from './SeriesCard';

type Props = {
  row: SeriesDto[];
  metrics: BrowseGridMetrics;
  getCoverUrl: (seriesId: number) => string;
  onPress: (item: SeriesDto) => void;
  onLongPress?: (item: SeriesDto) => void;
  theme: Theme;
};

/** One browse grid row — fixed column width from metrics (landscape = 5 slots). */
const BrowseSeriesRow = memo(function BrowseSeriesRow({
  row,
  metrics,
  getCoverUrl,
  onPress,
  onLongPress,
  theme,
}: Props) {
  const slotWidth = metrics.cardWidth;

  return (
    <View style={[styles.row, { gap: metrics.gap, marginBottom: metrics.gap }]}>
      {row.map((item) => (
        <View key={item.id} style={{ width: slotWidth }}>
          <SeriesCard
            item={item}
            coverUrl={getCoverUrl(item.id)}
            onPress={onPress}
            onLongPress={onLongPress}
            theme={theme}
            placeholderColor={theme.border}
            infoHeight={metrics.infoHeight}
            compact={metrics.compactCard}
            fillSlot
          />
        </View>
      ))}
    </View>
  );
});

export default BrowseSeriesRow;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    width: '100%',
  },
});
