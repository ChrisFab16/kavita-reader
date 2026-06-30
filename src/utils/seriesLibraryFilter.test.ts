import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { filterSeriesForLibrary, hasCrossLibrarySeries } from './seriesLibraryFilter';
import type { SeriesDto } from '../types/kavita';

function series(id: number, libraryId?: number): SeriesDto {
  return {
    id,
    name: `Series ${id}`,
    originalName: '',
    localizedName: '',
    sortName: '',
    summary: '',
    libraryId: libraryId ?? 0,
    coverImageLocked: false,
    pages: 0,
    pagesRead: 0,
    format: 0,
    created: '',
    lastModified: '',
  };
}

describe('seriesLibraryFilter', () => {
  it('filters to matching libraryId when present on items', () => {
    const input = [series(1, 2), series(2, 3), series(3, 2)];
    assert.deepEqual(filterSeriesForLibrary(input, 2).map((s) => s.id), [1, 3]);
  });

  it('returns input unchanged when no libraryId on items', () => {
    const input = [series(1), series(2)];
    assert.equal(filterSeriesForLibrary(input, 2).length, 2);
  });

  it('detects cross-library leakage', () => {
    assert.equal(hasCrossLibrarySeries([series(1, 2), series(2, 2)], 2), false);
    assert.equal(hasCrossLibrarySeries([series(1, 2), series(2, 3)], 2), true);
  });
});
