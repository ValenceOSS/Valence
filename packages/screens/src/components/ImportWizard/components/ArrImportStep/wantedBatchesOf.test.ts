import { describe, expect, it } from 'vitest';
import { BATCH, wantedBatchesOf } from './wantedBatchesOf';

describe('wantedBatchesOf', () => {
  it('splits things into batches the server takes', () => {
    const batches = wantedBatchesOf(Array.from({ length: BATCH * 2 + 1 }, (_, index) => index));

    expect(batches.map((batch) => batch.length)).toEqual([BATCH, BATCH, 1]);
    expect(wantedBatchesOf([])).toEqual([]);
  });
});
