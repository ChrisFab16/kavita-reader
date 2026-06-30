import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hasMoreSeriesPages, mergeSeriesPages } from './seriesPagination';
import type { SeriesDto } from '../types/kavita';

function series(id: number): SeriesDto {
  return {
    id,
    name: `Series ${id}`,
    originalName: '',
    localizedName: '',
    sortName: '',
    summary: '',
    libraryId: 1,
    coverImageLocked: false,
    pages: 0,
    pagesRead: 0,
    format: 0,
    created: '',
    lastModified: '',
  };
}

describe('seriesPagination', () => {
  it('mergeSeriesPages appends only new ids', () => {
    const merged = mergeSeriesPages([series(1), series(2)], [series(2), series(3)]);
    assert.deepEqual(merged.map((s) => s.id), [1, 2, 3]);
  });

  it('hasMoreSeriesPages uses pagination metadata when present', () => {
    assert.equal(
      hasMoreSeriesPages({ currentPage: 1, totalPages: 3, totalItems: 250, pageSize: 100, hasNextPage: true }, 100, 100),
      true
    );
    assert.equal(
      hasMoreSeriesPages({ currentPage: 3, totalPages: 3, totalItems: 250, pageSize: 100 }, 50, 100),
      false
    );
  });

  it('hasMoreSeriesPages falls back to page size when pagination is null', () => {
    assert.equal(hasMoreSeriesPages(null, 100, 100), true);
    assert.equal(hasMoreSeriesPages(null, 40, 100), false);
  });

  it('hasMoreSeriesPages uses totalPages even when filtered result count is short', () => {
    assert.equal(
      hasMoreSeriesPages({ currentPage: 1, totalPages: 5, totalItems: 450, pageSize: 100 }, 42, 100),
      true
    );
  });
});
