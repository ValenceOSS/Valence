import { describe, expect, it, vi } from 'vitest';
import { createMemoryHistoryService } from '@ValenceServer/history/createMemoryHistoryService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { aPluginHostForTest } from '@ValenceServer/plugins/broker/aPluginHostForTest';
import { createPluginHost } from './createPluginHost';
import type { PlaylistService } from '@ValenceServer/playlists/PlaylistService';
import type { PlaylistSummary } from '@ValenceContracts/schemas/Playlist';
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
  durationSeconds: 0,
  artworkAlbumIds: [],
  hasOwnArtwork: false,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const unused = () => Promise.reject(new Error('not used here'));

const build = () => {
  const progress = createMemoryWatchProgressService();
  const history = createMemoryHistoryService();
  const seen: Viewer[] = [];
  const playlists: PlaylistService = {
    list: vi.fn((viewer: Viewer) => {
      seen.push(viewer);

      return Promise.resolve([PLAYLIST]);
    }),
    read: unused,
    create: vi.fn(() => Promise.resolve(PLAYLIST)),
    update: unused,
    remove: unused,
    add: vi.fn((_viewer: Viewer, playlistId: string) =>
      Promise.resolve(playlistId === PLAYLIST.id ? 2 : null),
    ),
    move: unused,
    drop: unused,
    readArtwork: unused,
    saveArtwork: unused,
    dropArtwork: unused,
  };
  const notify = vi.fn(() => Promise.resolve());
  const publish = vi.fn(() => Promise.resolve());
  const fake = aPluginHostForTest();
  const host = createPluginHost({
    readProfile: (profileId) =>
      Promise.resolve(
        profileId === 'p1' ? { id: 'p1', name: 'Sam', accountId: 'account-1' } : null,
      ),
    media: { ...fake.library, findTrack: fake.music.findTrack },
    durationOf: (mediaId) => Promise.resolve(mediaId === 'm1' ? 1440 : null),
    progress,
    history,
    playlists,
    notify,
    requests: fake.requests,
    publish,
  });

  return { host, progress, history, playlists, seen, notify, publish };
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

  it('reaches playlists as the person, never as an administrator', async () => {
    const { host, seen } = build();

    expect(await host.playlists.list('p1')).toEqual([{ id: PLAYLIST.id, name: 'Imported' }]);
    expect(seen).toEqual([
      { kind: 'account', accountId: 'account-1', profileId: 'p1', isAdministrator: false },
    ]);
    expect(await host.playlists.create('p1', { name: 'Imported', description: null })).toEqual({
      id: PLAYLIST.id,
    });
    await expect(host.playlists.add('p1', PLAYLIST.id, ['m1'])).resolves.toBeUndefined();
    await expect(host.playlists.add('p1', 'not-theirs', ['m1'])).rejects.toThrow(
      'no such playlist',
    );
    await expect(host.playlists.list('gone')).rejects.toThrow('no such profile');
  });

  it('tells the person’s account, saying which plugin it is from', async () => {
    const { host, notify } = build();

    await host.notifications.send('p1', { title: 'Synced', body: '3 episodes', from: 'AniList' });
    await host.notifications.send('gone', { title: 'Synced', body: 'x', from: 'AniList' });

    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith('account-1', {
      title: 'AniList: Synced',
      body: '3 episodes',
    });
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
