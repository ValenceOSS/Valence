import { A_PLUGIN_MEDIA_FOR_TEST } from '@ValenceServer/plugins/broker/A_PLUGIN_MEDIA_FOR_TEST';
import { A_MUSIC_TRACK_FOR_TEST } from '@ValenceServer/music/A_MUSIC_TRACK_FOR_TEST';
import { describe, expect, it, vi } from 'vitest';
import { createMemoryHistoryService } from '@ValenceServer/history/createMemoryHistoryService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { aPluginHostForTest } from '@ValenceServer/plugins/broker/aPluginHostForTest';
import { createPluginHost } from './createPluginHost';
import type { PlaylistService } from '@ValenceServer/playlists/PlaylistService';
import type { PlaylistEntry, PlaylistSummary } from '@ValenceContracts/schemas/Playlist';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

const PLAYLIST: PlaylistSummary = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Imported',
  description: null,
  isShared: false,
  isOrdered: false,
  isMine: true,
  owner: null,
  entryCount: 0,
  lostCount: 0,
  missingCount: 0,
  durationSeconds: 0,
  artworkAlbumIds: [],
  hasOwnArtwork: false,
  isSmart: false,
  rules: null,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const SAM: Viewer = {
  kind: 'account',
  accountId: 'account-1',
  profileId: 'p1',
  isAdministrator: false,
};

const A_SONG: NonNullable<PlaylistEntry['item']> = {
  id: 'm1',
  kind: 'song',
  title: 'Running Up That Hill',
  subtitle: 'Kate Bush',
  durationSeconds: 300,
  track: null,
};

const unused = () => Promise.reject(new Error('not used here'));

const build = (locked: readonly string[] = []) => {
  const progress = createMemoryWatchProgressService();
  const history = createMemoryHistoryService();
  const seen: Viewer[] = [];
  const playlists: PlaylistService = {
    list: vi.fn((viewer: Viewer) => {
      seen.push(viewer);

      return Promise.resolve([PLAYLIST]);
    }),
    read: vi.fn((_viewer: Viewer, playlistId: string) =>
      Promise.resolve(
        playlistId === PLAYLIST.id
          ? {
              playlist: PLAYLIST,
              entries: [
                { id: 'e1', position: 1, addedAt: PLAYLIST.updatedAt, item: A_SONG, missing: null },
                { id: 'e2', position: 2, addedAt: PLAYLIST.updatedAt, item: null, missing: null },
                {
                  id: 'e3',
                  position: 3,
                  addedAt: PLAYLIST.updatedAt,
                  item: null,
                  missing: {
                    title: 'Low Tide',
                    artist: 'Mara Quill',
                    album: null,
                    releaseId: null,
                    coverUrl: null,
                  },
                },
              ],
            }
          : null,
      ),
    ),
    fillsItself: vi.fn(() => Promise.resolve(false)),
    create: vi.fn(() => Promise.resolve(PLAYLIST)),
    update: vi.fn((_viewer: Viewer, playlistId: string) =>
      Promise.resolve(playlistId === PLAYLIST.id ? PLAYLIST : null),
    ),
    remove: vi.fn((_viewer: Viewer, playlistId: string) =>
      Promise.resolve(playlistId === PLAYLIST.id),
    ),
    add: vi.fn((_viewer: Viewer, playlistId: string) =>
      Promise.resolve(playlistId === PLAYLIST.id ? 2 : null),
    ),
    move: unused,
    dropMany: vi.fn((_viewer: Viewer, playlistId: string, entryIds: readonly string[]) =>
      Promise.resolve(playlistId === PLAYLIST.id ? entryIds.length : null),
    ),
    drop: vi.fn((_viewer: Viewer, playlistId: string, entryId: string) =>
      Promise.resolve(playlistId === PLAYLIST.id && entryId === 'e1'),
    ),
    readArtwork: unused,
    saveArtwork: unused,
    dropArtwork: unused,
  };
  const musicLibrary = {
    listLiked: vi.fn(() => Promise.resolve([A_MUSIC_TRACK_FOR_TEST])),
    listArtists: vi.fn(() => Promise.resolve([])),
    keepArtist: vi.fn(() => Promise.resolve(true)),
    dropArtist: vi.fn(() => Promise.resolve(true)),
  };
  const favourites = {
    keep: vi.fn(() => Promise.resolve()),
    drop: vi.fn(() => Promise.resolve()),
  };
  const ratings = {
    set: vi.fn(() => Promise.resolve()),
    clear: vi.fn(() => Promise.resolve()),
  };
  const notify = vi.fn(() => Promise.resolve());
  const publish = vi.fn(() => Promise.resolve());
  const fake = aPluginHostForTest();
  const host = createPluginHost({
    readProfile: (profileId) =>
      Promise.resolve(
        profileId === 'p1' ? { id: 'p1', name: 'Sam', accountId: 'account-1' } : null,
      ),
    lockedLibraries: () => Promise.resolve(locked),
    media: fake.library,
    music: fake.music,
    musicLibrary,
    favourites,
    ratings,
    durationOf: (mediaId) => Promise.resolve(mediaId === 'm1' ? 1440 : null),
    progress,
    viewingState: fake.viewing.state,
    history,
    playlists,
    notify,
    requests: fake.requests,
    publish,
    jobs: fake.jobs,
  });

  return {
    host,
    progress,
    history,
    playlists,
    seen,
    notify,
    publish,
    musicLibrary,
    favourites,
    ratings,
  };
};

describe('what Valence does when a plugin asks', () => {
  it('marks something watched as a person finishing it would, and unwatched again', async () => {
    const { host, progress, history } = build();

    await host.viewing.markWatched('p1', 'm1', '2026-03-01T20:00:00.000Z');

    expect(await progress.read('p1', 'm1')).toMatchObject({
      positionSeconds: 1440,
      durationSeconds: 1440,
      isFinished: true,
    });
    expect(history.state.viewings).toHaveLength(1);
    expect(await host.viewing.progress('p1', null)).toHaveLength(1);
    expect(await host.viewing.progress('p1', '2999-01-01T00:00:00.000Z')).toEqual([]);

    await host.viewing.markUnwatched('p1', 'm1');

    expect(await progress.read('p1', 'm1')).toBeNull();
  });

  it('refuses to mark something that is not in the library', async () => {
    await expect(build().host.viewing.markWatched('p1', 'nothing', null)).rejects.toThrow(
      'no such media',
    );
  });

  it('reaches playlists as the person it is given', async () => {
    const { host, seen } = build();

    expect(await host.playlists.list(SAM)).toEqual([{ id: PLAYLIST.id, name: 'Imported' }]);
    expect(seen).toEqual([
      { kind: 'account', accountId: 'account-1', profileId: 'p1', isAdministrator: false },
    ]);
    expect(await host.playlists.create(SAM, { name: 'Imported', description: null })).toEqual({
      id: PLAYLIST.id,
    });
    await expect(host.playlists.add(SAM, PLAYLIST.id, ['m1'])).resolves.toBeUndefined();
    await expect(host.playlists.add(SAM, 'not-theirs', ['m1'])).rejects.toThrow('no such playlist');
  });

  it('reads as a person in the background with every locked library still locked', async () => {
    expect(await build().host.viewerOf('p1')).toEqual({
      kind: 'account',
      accountId: 'account-1',
      profileId: 'p1',
      isAdministrator: false,
    });
    expect(await build(['l1', 'l2']).host.viewerOf('p1')).toEqual({
      kind: 'account',
      accountId: 'account-1',
      profileId: 'p1',
      isAdministrator: false,
      lockedLibraries: ['l1', 'l2'],
    });
    await expect(build().host.viewerOf('gone')).rejects.toThrow('no such profile');
  });

  it('adds songs the library does not have yet beside ones it does, in order', async () => {
    const { host, playlists } = build();

    await host.playlists.add(SAM, PLAYLIST.id, [
      'm1',
      { title: 'Low Tide', artist: 'Mara Quill' },
      { title: 'Paper Kites', artist: 'Odell Finch', album: 'Paper Kites', releaseId: null },
    ]);

    expect(playlists.add).toHaveBeenCalledWith(expect.anything(), PLAYLIST.id, [
      'm1',
      { title: 'Low Tide', artist: 'Mara Quill', album: null, releaseId: null },
      { title: 'Paper Kites', artist: 'Odell Finch', album: 'Paper Kites', releaseId: null },
    ]);
  });

  it('reads what a playlist holds, and drops one entry from it', async () => {
    const { host } = build();

    await expect(host.playlists.read(SAM, PLAYLIST.id)).resolves.toEqual({
      id: PLAYLIST.id,
      name: 'Imported',
      entries: [
        { entryId: 'e1', mediaId: 'm1', missing: null },
        { entryId: 'e2', mediaId: null, missing: null },
        {
          entryId: 'e3',
          mediaId: null,
          missing: { title: 'Low Tide', artist: 'Mara Quill', album: null, releaseId: null },
        },
      ],
    });
    await expect(host.playlists.read(SAM, 'not-theirs')).resolves.toBeNull();
    await expect(host.playlists.drop(SAM, PLAYLIST.id, 'e1')).resolves.toBeUndefined();
    await expect(host.playlists.drop(SAM, PLAYLIST.id, 'e9')).rejects.toThrow('no such entry');
  });

  it('renames, empties and removes a playlist of theirs, and refuses to fill one that fills itself', async () => {
    const { host, playlists } = build();

    await host.playlists.rename(SAM, PLAYLIST.id, { name: 'Renamed', description: null });
    await host.playlists.rename(SAM, PLAYLIST.id, { name: 'Again', description: 'Notes' });
    await host.playlists.remove(SAM, PLAYLIST.id);

    expect(playlists.update).toHaveBeenNthCalledWith(1, SAM, PLAYLIST.id, { name: 'Renamed' });
    expect(playlists.update).toHaveBeenNthCalledWith(2, SAM, PLAYLIST.id, {
      name: 'Again',
      description: 'Notes',
    });
    expect(playlists.remove).toHaveBeenCalledWith(SAM, PLAYLIST.id, false);
    await expect(
      host.playlists.rename(SAM, 'not-theirs', { name: 'X', description: null }),
    ).rejects.toThrow('no such playlist');
    await expect(host.playlists.remove(SAM, 'not-theirs')).rejects.toThrow('no such playlist');

    await host.playlists.dropMany(SAM, PLAYLIST.id, ['e1', 'e2']);

    expect(playlists.dropMany).toHaveBeenCalledWith(SAM, PLAYLIST.id, ['e1', 'e2']);
    await expect(host.playlists.dropMany(SAM, 'not-theirs', ['e1'])).rejects.toThrow(
      'no such playlist',
    );

    vi.mocked(playlists.fillsItself).mockResolvedValue(true);

    await expect(host.playlists.add(SAM, PLAYLIST.id, ['m1'])).rejects.toThrow('fills itself');
    await expect(host.playlists.drop(SAM, PLAYLIST.id, 'e1')).rejects.toThrow('fills itself');
    await expect(host.playlists.dropMany(SAM, PLAYLIST.id, ['e1'])).rejects.toThrow('fills itself');
  });

  it('likes songs, follows artists and stars songs as the person, and keeps nothing for an album', async () => {
    const { host, favourites, ratings, musicLibrary } = build();
    const song = { ...A_PLUGIN_MEDIA_FOR_TEST, id: 't1', kind: 'track' as const };
    const artist = { ...A_PLUGIN_MEDIA_FOR_TEST, id: 'ar1', kind: 'artist' as const };
    const album = { ...A_PLUGIN_MEDIA_FOR_TEST, id: 'al1', kind: 'album' as const };

    await expect(host.viewing.favourite(SAM, song, true)).resolves.toEqual({ isKept: true });
    await expect(host.viewing.favourite(SAM, song, false)).resolves.toEqual({ isKept: true });
    await expect(host.viewing.favourite(SAM, artist, true)).resolves.toEqual({ isKept: true });
    await expect(host.viewing.favourite(SAM, artist, false)).resolves.toEqual({ isKept: true });
    await expect(host.viewing.favourite(SAM, album, true)).resolves.toEqual({ isKept: false });
    await expect(host.viewing.rate(SAM, song, 4)).resolves.toEqual({ isKept: true });
    await expect(host.viewing.rate(SAM, song, null)).resolves.toEqual({ isKept: true });
    await expect(host.viewing.rate(SAM, album, 4)).resolves.toEqual({ isKept: false });

    expect(favourites.keep).toHaveBeenCalledWith('p1', 't1');
    expect(favourites.drop).toHaveBeenCalledWith('p1', 't1');
    expect(musicLibrary.keepArtist).toHaveBeenCalledWith('p1', 'ar1');
    expect(musicLibrary.dropArtist).toHaveBeenCalledWith('p1', 'ar1');
    expect(ratings.set).toHaveBeenCalledWith('p1', { mediaId: 't1' }, 4);
    expect(ratings.clear).toHaveBeenCalledWith('p1', { mediaId: 't1' });
    await expect(host.viewing.favourite({ kind: 'server' }, song, true)).rejects.toThrow(
      'a person to act for',
    );
  });

  it('lists the songs a person likes and the artists they follow', async () => {
    const { host, musicLibrary } = build();

    await expect(host.viewing.favourites(SAM, 'track')).resolves.toEqual([
      A_MUSIC_TRACK_FOR_TEST.id,
    ]);
    await expect(host.viewing.favourites(SAM, 'artist')).resolves.toEqual([]);
    expect(musicLibrary.listArtists).toHaveBeenCalledWith(SAM, {
      onlyFavourites: true,
      limit: 2000,
    });
  });

  it('tells the one profile it is for, saying which plugin it is from', async () => {
    const { host, notify } = build();

    await host.notifications.send('p1', { title: 'Synced', body: '3 episodes', from: 'AniList' });
    await host.notifications.send('gone', { title: 'Synced', body: 'x', from: 'AniList' });

    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith(
      { accountId: 'account-1', profileId: 'p1' },
      {
        title: 'AniList: Synced',
        body: '3 episodes',
      },
    );
  });

  it('hands an event a plugin sends to Valence’s webhooks, as a plugin event', async () => {
    const { host, publish } = build();
    const event = {
      pluginId: 'music-import',
      pluginName: 'Playlist import',
      name: 'imported',
      title: 'A playlist was imported',
      detail: { songs: 12 },
    };

    await host.events.emit(event);

    expect(publish).toHaveBeenCalledWith({ event: 'plugin.event', data: event });
  });
});
