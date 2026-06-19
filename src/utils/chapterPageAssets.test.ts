import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getPageWarmIndices, warmConcurrency } from './chapterPageAssets.ts';

describe('chapterPageAssets', () => {
  it('prefetches pages ahead of current', () => {
    assert.deepEqual(
      getPageWarmIndices(0, 10, { prefetchPages: 2, cacheEntireAlbum: false }),
      [1, 2]
    );
    assert.deepEqual(
      getPageWarmIndices(8, 10, { prefetchPages: 2, cacheEntireAlbum: false }),
      [9]
    );
  });

  it('returns empty when prefetch disabled', () => {
    assert.deepEqual(
      getPageWarmIndices(0, 10, { prefetchPages: 0, cacheEntireAlbum: false }),
      []
    );
  });

  it('cache entire album includes all pages', () => {
    assert.deepEqual(
      getPageWarmIndices(3, 5, { prefetchPages: 2, cacheEntireAlbum: true }),
      [0, 1, 2, 3, 4]
    );
  });

  it('warmConcurrency rises for full album', () => {
    assert.equal(warmConcurrency({ prefetchPages: 2, cacheEntireAlbum: false }), 2);
    assert.equal(warmConcurrency({ prefetchPages: 2, cacheEntireAlbum: true }), 3);
  });
});
