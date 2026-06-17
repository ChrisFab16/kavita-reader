import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  shouldHideVolumeHeader,
  formatVolumeTitle,
  formatSeriesStatsLabel,
  listVisibleVolumeTitles,
  countSeriesVolumes,
  isVolumeArchiveChapter,
  shouldCollapseVolumeToHeader,
  chaptersToRender,
  formatChapterTitle,
} from './volumeDisplay';
import type { VolumeListItem } from './volumeDisplay';

const FIXTURE_PATH = path.join(
  process.cwd(),
  'src/test-fixtures/dungeon-meshi-volumes.json'
);

function makeVolume(id: number, name: string, chapterCount = 1, range = '1'): VolumeListItem {
  return {
    id,
    name,
    minNumber: Number(name) || id,
    chapters: Array.from({ length: chapterCount }, (_, i) => ({
      id: id * 100 + i,
      range,
    })),
  };
}

function makeArchiveVolume(id: number, name: string): VolumeListItem {
  return makeVolume(id, name, 1, '-100000');
}

/** Delicious in Dungeon–style: 14 volumes named "1".."14", one archive chapter each. */
function deliciousInDungeonFixture(): VolumeListItem[] {
  return Array.from({ length: 14 }, (_, i) => makeArchiveVolume(i + 1, String(i + 1)));
}

describe('volumeDisplay', () => {
  describe('Delicious in Dungeon (14 numeric volumes)', () => {
    const volumes = deliciousInDungeonFixture();

    it('shows all 14 volume headers', () => {
      assert.equal(countSeriesVolumes(volumes), 14);
      volumes.forEach((vol) => {
        assert.equal(
          shouldHideVolumeHeader(vol, volumes),
          false,
          `volume "${vol.name}" should not hide header`
        );
      });
    });

    it('formats titles as Volume 1 .. Volume 14', () => {
      assert.deepEqual(listVisibleVolumeTitles(volumes), [
        'Volume 1',
        'Volume 2',
        'Volume 3',
        'Volume 4',
        'Volume 5',
        'Volume 6',
        'Volume 7',
        'Volume 8',
        'Volume 9',
        'Volume 10',
        'Volume 11',
        'Volume 12',
        'Volume 13',
        'Volume 14',
      ]);
    });

    it('series stats say 14 Volumes not 14 Books', () => {
      assert.equal(formatSeriesStatsLabel(volumes), '14 Volumes');
    });

    it('collapses each volume to a single tappable row (no duplicate chapter cards)', () => {
      volumes.forEach((vol) => {
        assert.equal(shouldCollapseVolumeToHeader(vol, volumes), true);
        assert.deepEqual(chaptersToRender(vol, volumes), []);
      });
    });

    it('never labels archive chapters as Chapter -100000', () => {
      const vol = volumes[12];
      const chapter = vol.chapters![0];
      assert.equal(isVolumeArchiveChapter(chapter), true);
      assert.equal(formatChapterTitle(chapter, vol, 0), 'Volume 13');
    });
  });

  describe('loose-leaf / special volumes', () => {
    it('hides negative sentinel volume names', () => {
      const volumes = [makeVolume(1, '-100000', 3)];
      assert.equal(shouldHideVolumeHeader(volumes[0], volumes), true);
    });

    it('hides volume "0" loose leaf', () => {
      const vol: VolumeListItem = { id: 1, name: '0', minNumber: 0, chapters: [{ id: 1 }] };
      assert.equal(shouldHideVolumeHeader(vol, [vol]), true);
    });
  });

  describe('single-book series', () => {
    it('hides redundant numeric header for one volume one chapter', () => {
      const volumes = [makeVolume(1, '1', 1)];
      assert.equal(shouldHideVolumeHeader(volumes[0], volumes), true);
    });

    it('stats use Books for single volume', () => {
      const volumes = [makeVolume(1, 'My Novel', 1)];
      assert.equal(formatSeriesStatsLabel(volumes), '1 Book');
    });
  });

  describe('named volumes', () => {
    it('preserves non-numeric volume names', () => {
      const vol = makeVolume(1, 'Omnibus Collection', 5);
      assert.equal(formatVolumeTitle(vol), 'Omnibus Collection');
      assert.equal(shouldHideVolumeHeader(vol, [vol]), false);
    });
  });

  describe('spec fixture: dungeon-meshi-volumes.json', () => {
    it('loads Kavita-shaped fixture and passes volume display contract', () => {
      const raw = fs.readFileSync(FIXTURE_PATH, 'utf8');
      const volumes = JSON.parse(raw) as VolumeListItem[];

      assert.equal(volumes.length, 14);
      assert.equal(countSeriesVolumes(volumes), 14);
      assert.equal(formatSeriesStatsLabel(volumes), '14 Volumes');
      assert.equal(listVisibleVolumeTitles(volumes)[13], 'Volume 14');
      assert.equal(shouldCollapseVolumeToHeader(volumes[0], volumes), true);
      assert.deepEqual(chaptersToRender(volumes[0], volumes), []);
    });
  });
});
