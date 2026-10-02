import { describe, expect, it } from 'vitest';
import { collectionCoverPath } from './collectionCoverPath';

const SAGA = {
  id: 'saga',
  hasOwnArtwork: false,
  updatedAt: '2026-10-02T00:00:00.000Z',
  coverMediaIds: ['first', 'second'],
};

describe('collectionCoverPath', () => {
  it('stands for a collection by the artwork it was given', () => {
    expect(collectionCoverPath({ ...SAGA, hasOwnArtwork: true })).toBe(
      `/api/collections/saga/artwork?v=${encodeURIComponent(SAGA.updatedAt)}`,
    );
  });

  it('falls back on the first poster in it', () => {
    expect(collectionCoverPath(SAGA)).toBe('/api/media/first/image/poster');
  });

  it('has nothing to show for a collection with no poster in it', () => {
    expect(collectionCoverPath({ ...SAGA, coverMediaIds: [] })).toBeNull();
  });
});
