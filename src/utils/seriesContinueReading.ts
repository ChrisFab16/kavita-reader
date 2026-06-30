import type { NavigationProp } from '@react-navigation/native';
import type { KavitaClient } from '../api/kavitaClient';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { SeriesDto } from '../types/kavita';

type SeriesResumeTarget = Pick<SeriesDto, 'id' | 'libraryId'>;

/** Open the reader at Kavita's continue point for this series (saved page via get-progress in reader). */
export async function openSeriesContinueReading(
  client: KavitaClient,
  navigation: NavigationProp<RootStackParamList>,
  series: SeriesResumeTarget
): Promise<void> {
  const chapter = await client.getContinuePoint(series.id);

  navigation.navigate('Reader', {
    chapterId: chapter.id,
    seriesId: series.id,
    volumeId: chapter.volumeId > 0 ? chapter.volumeId : undefined,
    libraryId: series.libraryId,
    chapterFormat: chapter.format,
    fileName: chapter.fileName ?? undefined,
  });

  void client.cacheChapter(chapter.id).catch((cacheErr) => {
    console.warn('Background chapter cache failed:', cacheErr);
  });
}
