import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLibraryFilterBody,
  KAVITA_FILTER_COMBINATION_AND,
  KAVITA_FILTER_FIELD,
} from './kavitaFilterV2';

describe('kavitaFilterV2', () => {
  it('buildLibraryFilterBody uses Libraries field (19) and AND combination', () => {
    const body = buildLibraryFilterBody(3);
    assert.equal(body.statements[0]?.field, KAVITA_FILTER_FIELD.Libraries);
    assert.equal(body.statements[0]?.value, '3');
    assert.equal(body.combination, KAVITA_FILTER_COMBINATION_AND);
    assert.equal(body.sortOptions, undefined);
  });

  it('buildLibraryFilterBody adds sortOptions for name sort', () => {
    const body = buildLibraryFilterBody(2, 'name');
    assert.deepEqual(body.sortOptions, { sortField: 1, isAscending: true });
  });
});
