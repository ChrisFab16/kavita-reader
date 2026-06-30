import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { READER_CHROME_Z_INDEX } from './readerNavigation';

describe('readerNavigation', () => {
  it('reader chrome z-index is above page turn zones', () => {
    assert.ok(READER_CHROME_Z_INDEX > 5);
  });
});
