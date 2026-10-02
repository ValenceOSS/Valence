import { describe, expect, it } from 'vitest';
import { collectionQueries } from './collectionQueries';

describe('collectionQueries', () => {
  it('keeps every collection query under one key, so one change refreshes them all', () => {
    const keys = [
      collectionQueries.all().queryKey,
      collectionQueries.all(true).queryKey,
      collectionQueries.containing({ mediaItemId: 'film' }).queryKey,
      collectionQueries.one('saga').queryKey,
    ];

    for (const key of keys) {
      expect(key[0]).toBe(collectionQueries.key[0]);
    }
  });

  it('keeps the list with the empty collections apart from the one without', () => {
    expect(collectionQueries.all(true).queryKey).not.toEqual(collectionQueries.all().queryKey);
  });

  it('asks after a film and a programme by their own ids', () => {
    expect(collectionQueries.containing({ seriesId: 'show' }).queryKey).toContain('show');
    expect(collectionQueries.containing({ mediaItemId: 'film' }).queryKey).toContain('film');
  });
});
