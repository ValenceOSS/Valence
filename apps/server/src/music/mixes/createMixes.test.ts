import { describe, expect, it, vi } from 'vitest';
import { createMemoryMusicPlays } from './createMemoryMusicPlays';
import { createMixes } from './createMixes';
import type { CatalogueSong } from '@ValenceServer/music/MusicService';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

const DAY_MS = 86_400_000;

const PAT = {
  kind: 'account',
  accountId: 'account',
  profileId: 'pat',
  isAdministrator: false,
} satisfies Viewer;

const SONGS: CatalogueSong[] = Array.from({ length: 30 }, (_, at) => ({
  id: `song-${at.toString()}`,
  albumId: 'album',
  hasArtwork: true,
  year: 2018,
  genres: ['Hip-Hop'],
  artists: [{ id: 'drake', name: 'Drake' }],
}));

/**
 * The mixes, over a library of thirty songs from one year and one genre, on a clock a test moves.
 *
 * @returns The mixes, how often the library was read, and a way to move the clock.
 */
const aDayOfMixes = () => {
  let at = 20_000 * DAY_MS;
  const listCatalogue = vi.fn(() => Promise.resolve(SONGS));
  const mixes = createMixes({
    music: { listCatalogue, listLiked: () => Promise.resolve([]) },
    plays: createMemoryMusicPlays(() => at),
    now: () => at,
  });

  return {
    mixes,
    listCatalogue,
    passTime: (ms: number) => {
      at += ms;
    },
  };
};

describe('createMixes', () => {
  it('makes a profile’s mixes from the songs it may hear', async () => {
    const { mixes } = aDayOfMixes();

    const made = await mixes.list(PAT);

    expect(made.map((mix) => mix.id)).toEqual(
      expect.arrayContaining(['genre-hip-hop', 'decade-2010']),
    );
  });

  it('makes them once a day, and again the next', async () => {
    const { mixes, listCatalogue, passTime } = aDayOfMixes();

    await mixes.list(PAT);
    passTime(60_000);
    await mixes.list(PAT);

    expect(listCatalogue).toHaveBeenCalledTimes(1);

    passTime(DAY_MS);
    await mixes.list(PAT);

    expect(listCatalogue).toHaveBeenCalledTimes(2);
  });

  it('makes them again once told to forget a profile’s', async () => {
    const { mixes, listCatalogue } = aDayOfMixes();

    await mixes.list(PAT);
    mixes.forget('pat');
    await mixes.list(PAT);

    expect(listCatalogue).toHaveBeenCalledTimes(2);
  });

  it('reads one of today’s mixes, and nothing for one there is not', async () => {
    const { mixes } = aDayOfMixes();

    await expect(mixes.read(PAT, 'decade-2010')).resolves.toMatchObject({ kind: 'decade' });
    await expect(mixes.read(PAT, 'decade-1950')).resolves.toBeNull();
  });

  it('makes none for a guest, or an account with no profile chosen', async () => {
    const { mixes, listCatalogue } = aDayOfMixes();

    await expect(mixes.list({ kind: 'guest', shareId: 'share' })).resolves.toEqual([]);
    await expect(mixes.list({ ...PAT, profileId: null })).resolves.toEqual([]);
    expect(listCatalogue).not.toHaveBeenCalled();
  });

  it('tries again next time where the library could not be read', async () => {
    const { mixes, listCatalogue } = aDayOfMixes();

    listCatalogue.mockRejectedValueOnce(new Error('The database went away.'));

    await expect(mixes.list(PAT)).rejects.toThrow('The database went away.');
    await expect(mixes.list(PAT)).resolves.not.toEqual([]);
  });
});
