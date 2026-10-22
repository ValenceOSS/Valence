import { describe, expect, it } from 'vitest';
import { artworkRevisions } from './artworkRevisions';

describe('artworkRevisions', () => {
  it('has nothing for an item whose artwork never changed', () => {
    expect(artworkRevisions.of('untouched')).toBe(0);
  });

  it('moves each item on when its artwork is changed here, even within one moment', () => {
    artworkRevisions.bump(['a', 'b'], () => 100);
    artworkRevisions.bump(['a'], () => 100);

    expect(artworkRevisions.of('a')).toBe(101);
    expect(artworkRevisions.of('b')).toBe(100);
  });

  it('takes the revision the server sent, keeping whichever is newer', () => {
    artworkRevisions.learn([{ id: 'c', artworkRevision: 500 }, { id: 'd' }]);
    artworkRevisions.learn([{ id: 'c', artworkRevision: 400 }]);

    expect(artworkRevisions.of('c')).toBe(500);
    expect(artworkRevisions.of('d')).toBe(0);
  });
});
