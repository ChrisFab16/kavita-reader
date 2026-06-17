import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { describeEmptyLibraryLoad } from './librarySeriesLoad';

describe('librarySeriesLoad', () => {
  it('flags missing pagination with empty result as failure', () => {
    assert.match(describeEmptyLibraryLoad(null) ?? '', /empty response/i);
  });

  it('flags totalItems > 0 with empty result as failure', () => {
    assert.match(
      describeEmptyLibraryLoad({ currentPage: 1, totalPages: 2, totalItems: 50, pageSize: 100 }) ?? '',
      /reported series/i
    );
  });

  it('allows legitimately empty library', () => {
    assert.equal(
      describeEmptyLibraryLoad({ currentPage: 1, totalPages: 0, totalItems: 0, pageSize: 100 }),
      null
    );
  });
});
