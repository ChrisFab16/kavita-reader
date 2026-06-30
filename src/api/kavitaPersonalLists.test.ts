import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildOnDeckQueryParams,
  buildPagedQueryParams,
  buildWantToReadFilterBody,
  buildWantToReadUpdateBody,
  KAVITA_PERSONAL_LIST_PATHS,
  resolveSeriesGridMode,
  toKavitaApiPageNumber,
} from './kavitaPersonalLists.ts';

describe('kavitaPersonalLists', () => {
  it('toKavitaApiPageNumber is 1-based', () => {
    assert.equal(toKavitaApiPageNumber(0), 1);
    assert.equal(toKavitaApiPageNumber(2), 3);
  });

  it('buildPagedQueryParams uses PageNumber and PageSize', () => {
    assert.deepEqual(buildPagedQueryParams(0, 50), { PageNumber: 1, PageSize: 50 });
  });

  it('buildOnDeckQueryParams adds optional libraryId', () => {
    assert.deepEqual(buildOnDeckQueryParams(1, 25), { PageNumber: 2, PageSize: 25 });
    assert.deepEqual(buildOnDeckQueryParams(0, 100, 3), {
      PageNumber: 1,
      PageSize: 100,
      libraryId: 3,
    });
  });

  it('buildWantToReadUpdateBody wraps seriesIds', () => {
    assert.deepEqual(buildWantToReadUpdateBody([1, 2]), { seriesIds: [1, 2] });
  });

  it('buildWantToReadFilterBody uses empty statements and sort', () => {
    const body = buildWantToReadFilterBody();
    assert.deepEqual(body.statements, []);
    assert.equal(body.combination, 1);
    assert.equal(body.sortOptions?.sortField, 1);
  });

  it('resolveSeriesGridMode prefers explicit gridMode', () => {
    assert.equal(resolveSeriesGridMode({ gridMode: 'onDeck' }), 'onDeck');
    assert.equal(resolveSeriesGridMode({ collectionId: 5 }), 'collection');
    assert.equal(resolveSeriesGridMode({ libraryId: 1 }), 'library');
  });

  it('documents personal list API paths', () => {
    assert.equal(KAVITA_PERSONAL_LIST_PATHS.onDeck, '/api/Series/on-deck');
    assert.equal(KAVITA_PERSONAL_LIST_PATHS.wantToReadV2, '/api/want-to-read/v2');
  });
});
