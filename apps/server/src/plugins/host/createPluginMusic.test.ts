import { describe, expect, it, vi } from 'vitest';
import { A_MUSIC_TRACK_FOR_TEST } from '@ValenceServer/music/A_MUSIC_TRACK_FOR_TEST';
import { A_PLUGIN_MEDIA_FOR_TEST } from '@ValenceServer/plugins/broker/A_PLUGIN_MEDIA_FOR_TEST';
import type { MusicService } from '@ValenceServer/music/MusicService';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import { createPluginMusic } from './createPluginMusic';

const SAM: Viewer = {
  kind: 'account',
  accountId: 'account-1',
  profileId: 'p1',
  isAdministrator: false,
};

const ALBUM = { ...A_PLUGIN_MEDIA_FOR_TEST, id: 'al1', kind: 'album' as const };

const TRACK = { ...A_PLUGIN_MEDIA_FOR_TEST, id: A_MUSIC_TRACK_FOR_TEST.id, kind: 'track' as const };

const AN_ARTIST = {
  artist: {
    id: 'ar1',
    libraryId: 'music',
    name: 'Mara Quill',
    hasImage: false,
    imageAlbumId: null,
    albumCount: 1,
    trackCount: 1,
    isFavourite: false,
  },
  albums: [],
  appearsOn: [],
  popular: [A_MUSIC_TRACK_FOR_TEST],
};

const unused = () => Promise.reject(new Error('not used here'));

/**
 * The plugin's music over a fake music service that holds one album and one song.
 *
 * @returns The plugin's music and the fakes behind it.
 */
const built = () => {
  const library: MusicService = {
    listAlbums: vi.fn(() =>
      Promise.resolve(
        ['missing', 'al1'].map((id) => ({
          id,
          libraryId: 'music',
          title: 'Harbour',
          artist: { id: 'ar1', name: 'Mara Quill' },
          year: 2020,
          genres: [],
          hasArtwork: false,
          isCompilation: false,
          trackCount: 1,
          durationSeconds: 240,
          sizeBytes: 1,
          isExplicit: false,
          addedAt: '2026-11-01T00:00:00.000Z',
        })),
      ),
    ),
    listArtists: unused,
    readAlbum: unused,
    readArtist: vi.fn((_viewer: Viewer, artistId: string) =>
      Promise.resolve(artistId === 'ar1' ? AN_ARTIST : null),
    ),
    listTracks: vi.fn((_viewer: Viewer, ids: readonly string[]) =>
      Promise.resolve(ids.includes(A_MUSIC_TRACK_FOR_TEST.id) ? [A_MUSIC_TRACK_FOR_TEST] : []),
    ),
    listLiked: unused,
    listPicks: vi.fn(() => Promise.resolve([A_MUSIC_TRACK_FOR_TEST])),
    listCatalogue: unused,
    listGenres: unused,
    countGenres: vi.fn(() => Promise.resolve([{ name: 'Folk', albums: 1, songs: 1 }])),
    listInGenre: vi.fn(() => Promise.resolve([A_MUSIC_TRACK_FOR_TEST])),
    search: unused,
    readLyrics: vi.fn(() =>
      Promise.resolve({ isSynced: false, lines: [{ atMs: null, text: 'la' }] }),
    ),
    readTrackFile: unused,
    readAlbumArtwork: unused,
    readArtistImage: unused,
    readArtistPicture: unused,
    keepArtist: unused,
    dropArtist: unused,
  };
  const details = vi.fn((ids: readonly string[]) =>
    Promise.resolve(
      [TRACK, ALBUM]
        .filter((ref) => ids.includes(ref.id))
        .map((ref) => ({
          ...ref,
          overview: null,
          genres: [],
          communityRating: null,
          certificationAge: null,
          addedAt: null,
          albumId: null,
          artistId: null,
          discNumber: null,
          trackNumber: null,
          file: null,
        })),
    ),
  );
  const plays = { record: vi.fn(() => Promise.resolve()) };
  const stories = {
    about: vi.fn(() =>
      Promise.resolve({ bio: 'A singer.', sourceUrl: 'https://example.test', missing: [] }),
    ),
    knows: vi.fn(() => false),
  };
  const listening = { report: vi.fn() };
  const music = createPluginMusic({
    library,
    details,
    findTrack: vi.fn(() => Promise.resolve(null)),
    plays,
    stories,
    listening,
  });

  return { music, library, details, plays, stories, listening };
};

describe('createPluginMusic', () => {
  it('lists albums in the order asked, as the music pages name it, leaving out what it can’t describe', async () => {
    const { music, library } = built();

    const albums = await music.albums(
      { order: 'recentlyPlayed', genre: 'Folk', years: null, offset: 5, limit: 10 },
      SAM,
    );

    expect(albums.map((album) => album.id)).toEqual(['al1']);
    expect(library.listAlbums).toHaveBeenCalledWith(SAM, {
      order: 'played',
      genre: 'Folk',
      offset: 5,
      limit: 10,
    });
  });

  it('passes on genres, a genre’s songs, lyrics, songs like others and an artist’s most played', async () => {
    const { music, library } = built();

    await expect(music.genres(SAM)).resolves.toEqual([{ name: 'Folk', albums: 1, songs: 1 }]);
    expect(
      (await music.inGenre('Folk', { offset: 0, limit: 5 }, SAM)).map((ref) => ref.id),
    ).toEqual([TRACK.id]);
    expect(library.listInGenre).toHaveBeenCalledWith(SAM, 'Folk', { offset: 0, limit: 5 });
    await expect(music.lyrics(TRACK.id, SAM)).resolves.toEqual({
      isSynced: false,
      lines: [{ atMs: null, text: 'la' }],
    });
    expect((await music.similar([TRACK.id], 3, SAM)).map((ref) => ref.id)).toEqual([TRACK.id]);
    expect(library.listPicks).toHaveBeenCalledWith(SAM, [TRACK.id], 3);
    expect((await music.topSongs('ar1', SAM)).map((ref) => ref.id)).toEqual([TRACK.id]);
    await expect(music.topSongs('nobody', SAM)).resolves.toEqual([]);
  });

  it('says what is known of an artist, and asks the web only where it may', async () => {
    const { music, stories } = built();

    await expect(music.aboutArtist('ar1', SAM, () => false)).resolves.toBeNull();
    expect(stories.about).not.toHaveBeenCalled();
    await expect(music.aboutArtist('ar1', SAM, () => true)).resolves.toEqual({
      bio: 'A singer.',
      sourceUrl: 'https://example.test',
    });
    stories.knows.mockReturnValue(true);
    await expect(music.aboutArtist('ar1', SAM, () => false)).resolves.toMatchObject({
      bio: 'A singer.',
    });
    await expect(music.aboutArtist('nobody', SAM, () => true)).resolves.toBeNull();
  });

  it('keeps a play at its time, and shows what an app plays, refusing a song the person can’t see', async () => {
    const { music, plays, listening } = built();
    const app = {
      appPasswordId: 'pw1',
      accountId: 'account-1',
      profileId: 'p1',
      profileName: 'Sam',
      label: 'Feishin',
    };

    await music.recordPlay('p1', { id: TRACK.id, durationSeconds: 240 }, 5_000);
    await music.nowPlaying(app, TRACK.id, SAM);
    await music.nowPlaying(app, null, SAM);

    expect(plays.record).toHaveBeenCalledWith('p1', TRACK.id, 5_000);
    expect(listening.report).toHaveBeenNthCalledWith(1, app, A_MUSIC_TRACK_FOR_TEST);
    expect(listening.report).toHaveBeenNthCalledWith(2, app, null);
    await expect(music.nowPlaying(app, 'hidden', SAM)).rejects.toThrow('There is no such song.');
  });

  it('counts a play said again within half the song once, and a later play again', async () => {
    const { music, plays } = built();
    const song = { id: TRACK.id, durationSeconds: 240 };

    await music.recordPlay('p1', song, 1_000_000);
    await music.recordPlay('p1', song, 1_050_000);
    await music.recordPlay('p2', song, 1_050_000);
    await music.recordPlay('p1', song, 1_200_000);
    await music.recordPlay('p1', { id: 'short', durationSeconds: 10 }, 2_000_000);
    await music.recordPlay('p1', { id: 'short', durationSeconds: 10 }, 2_020_000);
    await music.recordPlay('p1', { id: 'short', durationSeconds: null }, 2_040_000);

    expect(vi.mocked(plays.record).mock.calls).toEqual([
      ['p1', TRACK.id, 1_000_000],
      ['p2', TRACK.id, 1_050_000],
      ['p1', TRACK.id, 1_200_000],
      ['p1', 'short', 2_000_000],
      ['p1', 'short', 2_040_000],
    ]);
  });
});
