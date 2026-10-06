import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { createMemoryProfileService } from '@ValenceServer/profiles/createMemoryProfileService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemoryBookService } from '@ValenceServer/books/createMemoryBookService';
import type { Book } from '@ValenceContracts/schemas/Book';
import type { MusicServices } from '@ValenceServer/music/MusicServices';

const BASE = 'http://localhost:8420';

const BOOK_ID = '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0001';

const ALBUM_ID = '00000000-0000-4000-8000-00000000a1b1';

const RELEASE_GROUP = '00000000-0000-4000-8000-00000000b2b2';

const A_BOOK: Book = {
  id: BOOK_ID,
  libraryId: '2b6f0cc9-04f0-4f26-9f1a-1d5b2ea92d9f',
  title: 'Pride and Prejudice',
  layout: 'reflow',
  direction: 'leftToRight',
  year: 1813,
  overview: null,
  genres: null,
  authors: ['Jane Austen'],
  rating: null,
  hasCover: true,
  chapterCount: 1,
  addedAt: '2026-09-18T00:00:00.000Z',
  updatedAt: '2026-09-18T00:00:00.000Z',
};

const nothing = () => Promise.resolve(null);

const none = () => Promise.resolve([]);

const no = () => Promise.resolve(false);

/**
 * Music that knows nothing but how to correct an album, which is all these routes ask of it.
 */
const aMusic = () =>
  ({
    library: {
      listAlbums: vi.fn(none),
      listArtists: vi.fn(none),
      readAlbum: vi.fn(nothing),
      readArtist: vi.fn(nothing),
      listTracks: vi.fn(none),
      listLiked: vi.fn(none),
      listPicks: vi.fn(none),
      listCatalogue: vi.fn(() => Promise.resolve([])),
      search: vi.fn(() => Promise.resolve({ tracks: [], albums: [], artists: [] })),
      readLyrics: vi.fn(nothing),
      readTrackFile: vi.fn(nothing),
      readAlbumArtwork: vi.fn(nothing),
      readArtistImage: vi.fn(nothing),
      keepArtist: vi.fn(no),
      dropArtist: vi.fn(no),
    },
    playlists: {
      list: vi.fn(none),
      read: vi.fn(nothing),
      create: vi.fn(nothing),
      update: vi.fn(nothing),
      remove: vi.fn(no),
      add: vi.fn(() => Promise.resolve(0)),
      move: vi.fn(no),
      drop: vi.fn(no),
      readArtwork: vi.fn(nothing),
      saveArtwork: vi.fn(nothing),
      dropArtwork: vi.fn(no),
    },
    devices: {
      list: vi.fn(() => []),
      report: vi.fn(() => false),
      command: vi.fn(() => false),
      playingOn: vi.fn(() => null),
      order: vi.fn(() => false),
    },
    pictures: {
      cover: vi.fn(nothing),
      artistPicture: vi.fn(nothing),
      namedCover: vi.fn(nothing),
      releaseCover: vi.fn(nothing),
    },
    corrections: {
      search: vi.fn(() =>
        Promise.resolve([
          {
            kind: 'album' as const,
            musicBrainzId: RELEASE_GROUP,
            title: 'Silent Alarm',
            artist: 'Bloc Party',
            disambiguation: null,
            type: 'album' as const,
            year: 2005,
            coverUrl: null,
          },
        ]),
      ),
      correct: vi.fn((albumId: string) => Promise.resolve(albumId === ALBUM_ID)),
      forget: vi.fn((albumId: string) => Promise.resolve(albumId === ALBUM_ID)),
    },
    stories: { about: vi.fn(() => Promise.resolve({ bio: null, sourceUrl: null, missing: [] })) },
    stream: vi.fn(nothing),
    readImage: vi.fn(nothing),
  }) satisfies MusicServices;

const build = () => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();
  const music = aMusic();
  const app = createApp({
    auth,
    settings,
    permissions,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService(),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    profiles: createMemoryProfileService(),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    books: createMemoryBookService({ books: [A_BOOK], chapters: [] }),
    music,
  });

  return { app, music, permissions, store };
};

let built: ReturnType<typeof build>;

/**
 * Somebody signed in, who may correct what a title is only where they are given leave to.
 *
 * @param mayCorrect - Whether they are given leave.
 * @returns A way to ask the server as them.
 */
const signedIn = async (mayCorrect: boolean) => {
  const response = await built.app.request(`${BASE}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: BASE },
    body: JSON.stringify({ name: 'Dan', email: 'dan@valence.local', password: 'a-long-password' }),
  });
  const cookie = response.headers.get('set-cookie') ?? '';

  if (mayCorrect) {
    built.permissions.state.overrides[built.store.user[0]?.id ?? ''] = [
      { permission: 'media.override', effect: 'allow' },
    ];
  }

  return (
    path: string,
    init: { method?: string; body?: Record<string, string | number | null> } = {},
  ) =>
    built.app.request(`${BASE}${path}`, {
      method: init.method ?? 'GET',
      headers: { cookie, origin: BASE, 'content-type': 'application/json' },
      ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    });
};

beforeEach(() => {
  built = build();
});

describe('serveCorrections', () => {
  it('keeps every correction to somebody given leave to correct what a title is', async () => {
    const ask = await signedIn(false);

    expect((await ask('/api/admin/books/matches?q=pride')).status).toBe(404);
    expect((await ask('/api/admin/music/albums/matches?q=silent')).status).toBe(404);
    expect(
      (
        await ask(`/api/admin/music/albums/${ALBUM_ID}/match`, {
          method: 'POST',
          body: { releaseGroupId: RELEASE_GROUP, title: 'Silent Alarm', artist: 'Bloc Party' },
        })
      ).status,
    ).toBe(404);
    expect(built.music.corrections.correct).not.toHaveBeenCalled();
  });

  it('searches for the record an album really is', async () => {
    const ask = await signedIn(true);
    const response = await ask('/api/admin/music/albums/matches?q=silent%20alarm');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      matches: [expect.objectContaining({ musicBrainzId: RELEASE_GROUP, title: 'Silent Alarm' })],
    });
    expect(built.music.corrections.search).toHaveBeenCalledWith('silent alarm');
  });

  it('corrects an album, and says when there is no such album', async () => {
    const ask = await signedIn(true);
    const chosen = { releaseGroupId: RELEASE_GROUP, title: 'Silent Alarm', artist: 'Bloc Party' };

    const corrected = await ask(`/api/admin/music/albums/${ALBUM_ID}/match`, {
      method: 'POST',
      body: chosen,
    });
    const missing = await ask(
      '/api/admin/music/albums/00000000-0000-4000-8000-000000000999/match',
      { method: 'POST', body: chosen },
    );

    expect(corrected.status).toBe(200);
    expect(await corrected.json()).toEqual({ corrected: true });
    expect(built.music.corrections.correct).toHaveBeenCalledWith(ALBUM_ID, chosen);
    expect(missing.status).toBe(404);
  });

  it('forgets an album’s correction', async () => {
    const ask = await signedIn(true);

    const forgotten = await ask(`/api/admin/music/albums/${ALBUM_ID}/match`, { method: 'DELETE' });

    expect(forgotten.status).toBe(200);
    expect(await forgotten.json()).toEqual({ corrected: false });
    expect(
      (
        await ask('/api/admin/music/albums/00000000-0000-4000-8000-000000000999/match', {
          method: 'DELETE',
        })
      ).status,
    ).toBe(404);
  });

  it('searches for, corrects and forgets what a book really is', async () => {
    const ask = await signedIn(true);

    const searched = await ask('/api/admin/books/matches?q=pride');
    const corrected = await ask(`/api/admin/books/${BOOK_ID}/match`, {
      method: 'POST',
      body: { openLibraryId: 66554 },
    });
    const forgotten = await ask(`/api/admin/books/${BOOK_ID}/match`, { method: 'DELETE' });

    expect(searched.status).toBe(200);
    expect(await searched.json()).toEqual({ matches: [] });
    expect(corrected.status).toBe(200);
    expect(await corrected.json()).toEqual({ corrected: true });
    expect(forgotten.status).toBe(200);
    expect(await forgotten.json()).toEqual({ corrected: false });
  });

  it('says when there is no such book', async () => {
    const ask = await signedIn(true);

    expect(
      (await ask('/api/admin/books/nobody/match', { method: 'POST', body: { openLibraryId: 1 } }))
        .status,
    ).toBe(404);
    expect((await ask('/api/admin/books/nobody/match', { method: 'DELETE' })).status).toBe(404);
  });
});
