import { describe, expect, it, vi } from 'vitest';
import { createMissingAlbumMatcher } from './createMissingAlbumMatcher';
import type { MusicCatalogueHit } from '@ValenceContracts/schemas/MediaRequest';
import type { PlaylistDetail, PlaylistMissingSong } from '@ValenceContracts/schemas/Playlist';

const VIEWER = {
  kind: 'account',
  accountId: 'a1',
  profileId: 'p1',
  isAdministrator: false,
} as const;

const PLAYLIST_ID = '00000000-0000-4000-8000-00000000d0d0';

const hitFor = (title: string): MusicCatalogueHit => ({
  kind: 'album',
  musicBrainzId: '00000000-0000-4000-8000-0000000000a1',
  title,
  artist: 'Bicep',
  disambiguation: null,
  type: 'album',
  year: null,
  coverUrl: null,
});

const missing = (title: string, album: string) => ({
  title,
  artist: 'Bicep',
  album,
  releaseId: null,
  coverUrl: null,
});

const detailOf = (songs: ReturnType<typeof missing>[]): PlaylistDetail => ({
  playlist: {
    id: PLAYLIST_ID,
    name: 'Weekly Jams',
    description: null,
    isShared: false,
    isOrdered: false,
    isMine: true,
    owner: null,
    entryCount: 0,
    lostCount: 0,
    missingCount: songs.length,
    durationSeconds: 0,
    artworkAlbumIds: [],
    hasOwnArtwork: false,
    updatedAt: '2026-10-05T00:00:00.000Z',
  },
  entries: songs.map((song, at) => ({
    id: `e${at.toString()}`,
    position: at,
    addedAt: '2026-10-05T00:00:00.000Z',
    item: null,
    missing: song,
  })),
});

/**
 * A matcher over a playlist whose missing songs can be changed, whose finding waits to be let go,
 * and whose clock can be moved on.
 */
const build = (songs: ReturnType<typeof missing>[]) => {
  const held = { songs, time: 0 };
  let letGo = (): void => undefined;
  const find = vi.fn(async (asked: readonly PlaylistMissingSong[]) => {
    await new Promise<void>((resolve) => {
      letGo = resolve;
    });

    return asked.map((song) => (song.album === 'Unknown' ? null : hitFor(song.album ?? '')));
  });
  const onDone = vi.fn();
  const matcher = createMissingAlbumMatcher({
    playlists: {
      read: (_viewer, playlistId) =>
        Promise.resolve(playlistId === PLAYLIST_ID ? detailOf(held.songs) : null),
    },
    find,
    onDone,
    now: () => held.time,
  });
  const finish = async () => {
    letGo();
    await vi.waitFor(async () => {
      expect((await matcher.match(VIEWER, PLAYLIST_ID))?.isMatching).toBe(false);
    });
  };

  return { held, matcher, find, onDone, finish };
};

describe('createMissingAlbumMatcher', () => {
  it('looks for every album at once in the background, and is joined while it does', async () => {
    const { matcher, find, finish } = build([
      missing('Apricots', 'Isles'),
      missing('Atlas', 'Isles'),
      missing('Nowhere', 'Unknown'),
    ]);

    const first = await matcher.match(VIEWER, PLAYLIST_ID);

    expect(first).toMatchObject({ isMatching: true });
    expect(first?.albums.map((album) => [album.song.title, album.songCount, album.hit])).toEqual([
      ['Apricots', 2, undefined],
      ['Nowhere', 1, undefined],
    ]);
    expect((await matcher.match(VIEWER, PLAYLIST_ID))?.isMatching).toBe(true);
    expect(find).toHaveBeenCalledOnce();

    await finish();

    expect(
      (await matcher.match(VIEWER, PLAYLIST_ID))?.albums.map((album) => album.hit?.title ?? null),
    ).toEqual(['Isles', null]);
    expect(find).toHaveBeenCalledOnce();
  });

  it('asks only about what is new when the playlist changes', async () => {
    const { held, matcher, find, finish } = build([missing('Apricots', 'Isles')]);

    await matcher.match(VIEWER, PLAYLIST_ID);
    await finish();
    held.songs = [missing('Apricots', 'Isles'), missing('Glue', 'Bicep')];

    const again = await matcher.match(VIEWER, PLAYLIST_ID);

    expect(again?.albums.map((album) => album.hit?.title)).toEqual(['Isles', undefined]);
    expect(find.mock.calls[1]?.[0]).toEqual([expect.objectContaining({ title: 'Glue' })]);
  });

  it('is done at once where every album is already known', async () => {
    const { held, matcher, find, finish } = build([missing('Apricots', 'Isles')]);

    await matcher.match(VIEWER, PLAYLIST_ID);
    await finish();
    held.time = 2 * 60 * 60 * 1000;

    expect((await matcher.match(VIEWER, PLAYLIST_ID))?.isMatching).toBe(false);
    expect(find).toHaveBeenCalledOnce();
  });

  it('says it is done only where it took long enough for the person to have gone', async () => {
    const quick = build([missing('Apricots', 'Isles')]);

    await quick.matcher.match(VIEWER, PLAYLIST_ID);
    await quick.finish();

    expect(quick.onDone).not.toHaveBeenCalled();

    const slow = build([missing('Apricots', 'Isles'), missing('Nowhere', 'Unknown')]);

    await slow.matcher.match(VIEWER, PLAYLIST_ID);
    slow.held.time = 30_000;
    await slow.finish();

    expect(slow.onDone).toHaveBeenCalledWith(
      VIEWER,
      { id: PLAYLIST_ID, name: 'Weekly Jams' },
      { found: 1, albums: 2 },
    );
  });

  it('waits a while for a run to be done, for a caller with nobody watching', async () => {
    const { matcher, find, finish } = build([missing('Apricots', 'Isles')]);
    const settled = matcher.settle(VIEWER, PLAYLIST_ID, 60_000);

    await vi.waitFor(() => {
      expect(find).toHaveBeenCalled();
    });
    await finish();

    expect((await settled)?.albums.map((album) => album.hit?.title)).toEqual(['Isles']);
  });

  it('gives up waiting after as long as it was given, still matching', async () => {
    const { matcher } = build([missing('Apricots', 'Isles')]);

    expect((await matcher.settle(VIEWER, PLAYLIST_ID, 5))?.isMatching).toBe(true);
    expect(await matcher.settle(VIEWER, 'not-theirs', 5)).toBeNull();
  });

  it('remembers nothing from a search that failed, so the next run asks again', async () => {
    const find = vi
      .fn<(songs: readonly PlaylistMissingSong[]) => Promise<(MusicCatalogueHit | null)[]>>()
      .mockRejectedValueOnce(new Error('unreachable'))
      .mockResolvedValue([hitFor('Isles')]);
    const held = { time: 0 };
    const matcher = createMissingAlbumMatcher({
      playlists: { read: () => Promise.resolve(detailOf([missing('Apricots', 'Isles')])) },
      find,
      onDone: vi.fn(),
      now: () => held.time,
    });

    expect((await matcher.settle(VIEWER, PLAYLIST_ID, 1000))?.albums[0]?.hit).toBeNull();
    expect((await matcher.settle(VIEWER, PLAYLIST_ID, 1000))?.albums[0]?.hit?.title).toBe('Isles');
    expect(find).toHaveBeenCalledTimes(2);
  });

  it('finds nothing for a playlist the person cannot read', async () => {
    expect(await build([]).matcher.match(VIEWER, 'not-theirs')).toBeNull();
  });
});
