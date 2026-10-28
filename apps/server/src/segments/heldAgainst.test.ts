import { describe, expect, it, vi } from 'vitest';
import { heldAgainst } from './heldAgainst';

const printsOf = (...ids: string[]) => ids.map((mediaId) => ({ mediaId }));

const stretch = { startSeconds: 10, endSeconds: 100 };

describe('heldAgainst', () => {
  it('stops once enough others share a stretch', () => {
    const match = vi.fn(() => stretch);

    expect(
      heldAgainst({ mediaId: 'a' }, printsOf('b', 'c', 'd', 'e'), match, { enough: 3, most: 10 }),
    ).toHaveLength(3);
    expect(match).toHaveBeenCalledTimes(3);
  });

  it('never holds an episode against itself', () => {
    const match = vi.fn((other: { mediaId: string }) => (other.mediaId === 'a' ? null : stretch));

    heldAgainst({ mediaId: 'a' }, printsOf('a', 'b'), match, { enough: 3, most: 10 });

    expect(match).toHaveBeenCalledTimes(1);
    expect(match).toHaveBeenCalledWith({ mediaId: 'b' });
  });

  it('goes on past others that share nothing', () => {
    const match = (other: { mediaId: string }) =>
      other.mediaId === 'b' || other.mediaId === 'c' ? null : stretch;

    expect(
      heldAgainst({ mediaId: 'a' }, printsOf('b', 'c', 'd', 'e'), match, { enough: 2, most: 10 }),
    ).toHaveLength(2);
  });

  it('gives up after trying as many as it may', () => {
    const match = vi.fn(() => null);

    expect(
      heldAgainst({ mediaId: 'a' }, printsOf('b', 'c', 'd', 'e', 'f'), match, {
        enough: 2,
        most: 3,
      }),
    ).toEqual([]);
    expect(match).toHaveBeenCalledTimes(3);
  });
});
