import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePaginationMetadata, parsePaginationHeader } from './kavitaPagination';

describe('kavitaPagination', () => {
  it('parsePaginationHeader reads Pagination JSON header', () => {
    const meta = parsePaginationHeader({
      Pagination: JSON.stringify({
        currentPage: 1,
        itemsPerPage: 100,
        totalItems: 350,
        totalPages: 4,
      }),
    });

    assert.deepEqual(meta, {
      currentPage: 1,
      totalPages: 4,
      totalItems: 350,
      pageSize: 100,
      hasNextPage: true,
    });
  });

  it('normalizePaginationMetadata derives hasNextPage', () => {
    assert.equal(
      normalizePaginationMetadata({ currentPage: 4, totalPages: 4, totalItems: 350, pageSize: 100 })
        ?.hasNextPage,
      false
    );
  });
});
