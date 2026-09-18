import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemoryProfileService } from '@ValenceServer/profiles/createMemoryProfileService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import type { MusicAlbum, MusicTrack } from '@ValenceContracts/schemas/Music';
import type { PlaylistSummary } from '@ValenceContracts/schemas/Playlist';
import type { MusicService } from './MusicService';
import type { MusicServices } from './MusicServices';
import type { PlaylistService } from '@ValenceServer/playlists/PlaylistService';

const BASE = 'http://localhost:8420';

const ALBUM_ID = '00000000-0000-4000-8000-00000000a1b1';
const TRACK_ID = '00000000-0000-4000-8000-00000000c0c0';
const ARTIST_ID = '00000000-0000-4000-8000-00000000a7a7';
const LIBRARY_ID = '00000000-0000-4000-8000-00000000f1f1';
const PLAYLIST_ID = '00000000-0000-4000-8000-00000000d0d0';

const ALBUM: MusicAlbum = {
  id: ALBUM_ID,
  libraryId: LIBRARY_ID,
  title: 'Even In Arcadia',
  artist: { id: ARTIST_ID, name: 'Sleep Token' },
  year: 2025,
  genres: ['Rock'],
  hasArtwork: true,
  isCompilation: false,
  trackCount: 10,
  durationSeconds: 3000,
  sizeBytes: 0,
  isExplicit: false,
  addedAt: '2026-09-18T00:00:00.000Z',
};

const TRACK: MusicTrack = {
  id: TRACK_ID,
  libraryId: LIBRARY_ID,
  title: 'Caramel',
  artists: [{ id: ARTIST_ID, name: 'Sleep Token' }],
  album: { id: ALBUM_ID, title: 'Even In Arcadia', hasArtwork: true },
  discNumber: null,
  trackNumber: 5,
  durationSeconds: 300,
  codec: 'flac',
  isLossless: true,
  isExplicit: false,
  bitDepth: 24,
  sampleRate: 44_100,
  bitrateKbps: 1492,
  hasLyrics: true,
  videoKey: null,
  isFavourite: false,
};

const PLAYLIST: PlaylistSummary = {
  id: PLAYLIST_ID,
  name: 'Sunday morning',
  description: null,
  isShared: false,
  isOrdered: false,
  isMine: true,
  owner: { profileId: '00000000-0000-4000-8000-000000000001', name: 'Dan', colour: '#3a8ee8' },
  entryCount: 0,
  durationSeconds: 0,
  artworkAlbumIds: [],
  updatedAt: '2026-09-18T00:00:00.000Z',
};

const fakeMusic = () => {
  const library: MusicService = {
    listAlbums: vi.fn(() => Promise.resolve([ALBUM])),
    listArtists: vi.fn(() => Promise.resolve([])),
    readAlbum: vi.fn((_viewer, albumId: string) =>
      Promise.resolve(albumId === ALBUM_ID ? { album: ALBUM, tracks: [TRACK] } : null),
    ),
    readArtist: vi.fn(() => Promise.resolve(null)),
    listTracks: vi.fn(() => Promise.resolve([TRACK])),
    listLiked: vi.fn(() => Promise.resolve([])),
    search: vi.fn(() => Promise.resolve({ tracks: [TRACK], albums: [], artists: [] })),
    readLyrics: vi.fn(() =>
      Promise.resolve({ isSynced: true, lines: [{ atMs: 1000, text: 'Words' }] }),
    ),
    readTrackFile: vi.fn(() =>
      Promise.resolve({
        path: '/music/caramel.flac',
        codec: 'flac',
        container: 'flac',
        isLossless: true,
        bitrateKbps: 1492,
      }),
    ),
    readAlbumArtwork: vi.fn(() => Promise.resolve('/cache/music/album.webp')),
    readArtistImage: vi.fn(() => Promise.resolve(null)),
    keepArtist: vi.fn(() => Promise.resolve(true)),
    dropArtist: vi.fn(() => Promise.resolve(true)),
  };

  const playlists: PlaylistService = {
    list: vi.fn(() => Promise.resolve([PLAYLIST])),
    read: vi.fn(() => Promise.resolve(null)),
    create: vi.fn(() => Promise.resolve(PLAYLIST)),
    update: vi.fn(() => Promise.resolve(null)),
    remove: vi.fn(() => Promise.resolve(false)),
    add: vi.fn(() => Promise.resolve(1)),
    move: vi.fn(() => Promise.resolve(true)),
    drop: vi.fn(() => Promise.resolve(true)),
  };

  const music = {
    library,
    playlists,
    devices: {
      list: vi.fn(() => []),
      report: vi.fn(() => true),
      command: vi.fn(() => false),
      playingOn: vi.fn(() => null),
      order: vi.fn(() => false),
    },
    stream: vi.fn(() =>
      Promise.resolve({
        body: new ReadableStream<Uint8Array>(),
        contentType: 'audio/flac',
        status: 206,
        contentRange: 'bytes 0-99/1000',
        contentLength: '100',
      }),
    ),
    readImage: vi.fn(() => Promise.resolve(new Uint8Array([1, 2, 3]))),
  } satisfies MusicServices;

  return music;
};

const build = () => {
  const profiles = createMemoryProfileService();
  const { auth, settings, store } = createMemoryAuth();
  const music = fakeMusic();

  const app = createApp({
    auth,
    settings,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService(),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    profiles,
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    music,
  });

  return { app, music, profiles, store };
};

const listening = async (context: ReturnType<typeof build>) => {
  const response = await context.app.request(`${BASE}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: BASE },
    body: JSON.stringify({ name: 'Dan', email: 'dan@valence.local', password: 'a-long-password' }),
  });

  const cookie = response.headers.get('set-cookie') ?? '';
  const accountId = context.store.user[0]?.id ?? '';

  await context.profiles.ensureDefault(accountId, 'Dan');

  return {
    ask: (path: string, init: { method?: string; body?: string; range?: string } = {}) =>
      context.app.request(`${BASE}${path}`, {
        method: init.method ?? 'GET',
        headers: {
          cookie,
          origin: BASE,
          'content-type': 'application/json',
          ...(init.range === undefined ? {} : { range: init.range }),
        },
        ...(init.body === undefined ? {} : { body: init.body }),
      }),
  };
};

let context: ReturnType<typeof build>;

beforeEach(() => {
  context = build();
});

describe('the music routes', () => {
  it('keep music to somebody signed in', async () => {
    const response = await context.app.request(`${BASE}/api/music/albums`);

    expect(response.status).toBe(401);
  });

  it('list the albums a viewer can see', async () => {
    const me = await listening(context);

    const response = await me.ask('/api/music/albums?order=recent');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ albums: [ALBUM] });
    expect(context.music.library.listAlbums).toHaveBeenCalledWith(expect.anything(), {
      order: 'recent',
    });
  });

  it('read an album with its tracks, and say when there is no such album', async () => {
    const me = await listening(context);

    expect((await me.ask(`/api/music/albums/${ALBUM_ID}`)).status).toBe(200);
    expect((await me.ask(`/api/music/albums/${ARTIST_ID}`)).status).toBe(404);
  });

  it('serve an album’s cover as a picture', async () => {
    const me = await listening(context);

    const response = await me.ask(`/api/music/albums/${ALBUM_ID}/artwork`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/webp');
  });

  it('stream a track at the quality asked for, passing the range through', async () => {
    const me = await listening(context);

    const response = await me.ask(`/api/music/tracks/${TRACK_ID}/stream?quality=normal`, {
      range: 'bytes=0-99',
    });

    expect(response.status).toBe(206);
    expect(response.headers.get('content-range')).toBe('bytes 0-99/1000');
    expect(response.headers.get('accept-ranges')).toBe('bytes');
    expect(context.music.stream).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/music/caramel.flac' }),
      { kind: 'encoded', kbps: 160 },
      'bytes=0-99',
    );
  });

  it('stream the file as it is where nobody asked for less', async () => {
    const me = await listening(context);

    await me.ask(`/api/music/tracks/${TRACK_ID}/stream`);

    expect(context.music.stream).toHaveBeenCalledWith(
      expect.anything(),
      { kind: 'original' },
      null,
    );
  });

  it('read a track’s lyrics', async () => {
    const me = await listening(context);

    const response = await me.ask(`/api/music/tracks/${TRACK_ID}/lyrics`);

    expect(await response.json()).toEqual({
      isSynced: true,
      lines: [{ atMs: 1000, text: 'Words' }],
    });
  });

  it('search songs, albums and artists, and the playlists named like it', async () => {
    const me = await listening(context);

    const response = await me.ask('/api/music/search?q=sunday');

    expect(await response.json()).toMatchObject({ tracks: [TRACK], playlists: [PLAYLIST] });
  });

  it('leave out playlists that are not named like the search', async () => {
    const me = await listening(context);

    const response = await me.ask('/api/music/search?q=caramel');

    expect(await response.json()).toMatchObject({ playlists: [] });
  });

  it('read tracks back by id', async () => {
    const me = await listening(context);

    await me.ask(`/api/music/tracks?ids=${TRACK_ID},${ALBUM_ID}`);

    expect(context.music.library.listTracks).toHaveBeenCalledWith(expect.anything(), [
      TRACK_ID,
      ALBUM_ID,
    ]);
  });

  it('follow an artist for the profile listening', async () => {
    const me = await listening(context);

    const response = await me.ask(`/api/music/artists/${ARTIST_ID}/favourite`, { method: 'PUT' });

    expect(await response.json()).toEqual({ isFavourite: true });
  });

  it('let a song be liked like anything else', async () => {
    const me = await listening(context);

    const response = await me.ask(`/api/media/${TRACK_ID}/favourite`, { method: 'PUT' });

    expect(response.status).toBe(204);
  });

  it('make a playlist', async () => {
    const me = await listening(context);

    const response = await me.ask('/api/playlists', {
      method: 'POST',
      body: JSON.stringify({ name: 'Sunday morning' }),
    });

    expect(response.status).toBe(201);
    expect(context.music.playlists.create).toHaveBeenCalledWith(expect.anything(), {
      name: 'Sunday morning',
    });
  });

  it('refuse to change somebody else’s playlist', async () => {
    const me = await listening(context);

    const response = await me.ask(`/api/playlists/${PLAYLIST_ID}`, {
      method: 'PATCH',
      body: JSON.stringify({ isShared: true }),
    });

    expect(response.status).toBe(404);
  });

  it('refuse a command for a device that is not the listener’s', async () => {
    const me = await listening(context);

    const response = await me.ask('/api/music/devices/somebody-else/command', {
      method: 'POST',
      body: JSON.stringify({ fromClientId: 'mine', command: { kind: 'pause' } }),
    });

    expect(response.status).toBe(404);
  });

  it('answer nothing on a server built without music', async () => {
    const bare = createApp({
      auth: createMemoryAuth().auth,
      settings: createMemoryAuth().settings,
      countUsers: () => Promise.resolve(1),
      promoteToAdmin: () => Promise.resolve(null),
      library: createMemoryLibraryService(),
      playback: createMemoryPlaybackService(),
      segments: createMemorySegmentService(),
      subtitles: createMemorySubtitleService({}),
      progress: createMemoryWatchProgressService(),
      favourites: createMemoryFavouriteService(),
      ratings: createMemoryRatingService(),
    });

    expect((await bare.request(`${BASE}/api/music/albums`)).status).not.toBe(200);
  });
});
