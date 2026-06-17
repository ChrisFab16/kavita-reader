import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildSeriesDetailRows, filterVolumesForSearch } from './seriesDetailList';
import type { VolumeListItem } from './volumeDisplay';

function vol(id: number, name: string, chapters: VolumeListItem['chapters']): VolumeListItem {
  return { id, name, chapters };
}

describe('seriesDetailList', () => {
  it('buildSeriesDetailRows emits volume headers and chapters', () => {
    const volumes: VolumeListItem[] = [
      vol(1, '1', [{ id: 10, range: '1', pages: 20, pagesRead: 0 }]),
      vol(2, '2', [{ id: 11, range: '1', pages: 20, pagesRead: 0 }]),
    ];
    const rows = buildSeriesDetailRows(volumes);
    assert.ok(rows.some((r) => r.kind === 'volume-header'));
    assert.ok(rows.some((r) => r.kind === 'chapter' && r.chapter.id === 10));
    assert.equal(rows.filter((r) => r.kind === 'chapter').length, 2);
  });

  it('buildSeriesDetailRows collapses single-volume archive to volume-card only', () => {
    const volumes: VolumeListItem[] = [
      vol(1, 'Special Edition', [{ id: 10, range: '-100000', pages: 200, pagesRead: 0 }]),
    ];
    const rows = buildSeriesDetailRows(volumes);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.kind, 'volume-card');
  });

  it('filterVolumesForSearch matches chapter fileName and volume title', () => {
    const volumes: VolumeListItem[] = [
      vol(1, '1', [
        { id: 10, range: '1', fileName: 'Dungeon Meshi v01.cbz', pages: 20 },
        { id: 11, range: '2', fileName: 'Other.cbz', pages: 20 },
      ]),
      vol(2, 'Side Stories', [{ id: 12, range: '1', fileName: 'bonus.cbz', pages: 10 }]),
    ];

    const byFile = filterVolumesForSearch(volumes, 'dungeon');
    assert.equal(byFile.length, 1);
    assert.equal(byFile[0]?.chapters?.length, 1);
    assert.equal(byFile[0]?.chapters?.[0]?.id, 10);

    const byVolume = filterVolumesForSearch(volumes, 'side');
    assert.equal(byVolume.length, 1);
    assert.equal(byVolume[0]?.id, 2);
    assert.equal(byVolume[0]?.chapters?.length, 1);
  });
});
