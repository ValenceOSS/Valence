import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-native';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { LIKED_SONGS } from '@ValenceTv/music/LIKED_SONGS';
import { useCollection } from '@ValenceTv/screens/MusicCollection/useCollection';
import type { ReactNode } from 'react';
import type { MusicAlbum, MusicArtist } from '@ValenceContracts/schemas/Music';
import type { PlaylistDetail, PlaylistSummary } from '@ValenceContracts/schemas/Playlist';
import type { ListenedView } from '@ValenceTv/music/ListenedView';

const ALBUM_ID = '00000000-0000-4000-8000-00000000a1b1';

const ARTIST_ID = '00000000-0000-4000-8000-00000000a7a7';

const PLAYLIST_ID = '00000000-0000-4000-8000-0000000000b1';

const anAlbum = (change: Partial<MusicAlbum> = {}): MusicAlbum => ({
  id: ALBUM_ID,
  libraryId: '00000000-0000-4000-8000-00000000f1f1',
  title: 'Even In Arcadia',
  artist: { id: ARTIST_ID, name: 'Sleep Token' },
  year: 2025,
  genres: [],
  hasArtwork: true,
  isCompilation: false,
  trackCount: 3,
  durationSeconds: 600,
  sizeBytes: 0,
  isExplicit: false,
  addedAt: '2026-01-01T00:00:00.000Z',
  ...change,
});

const ARTIST: MusicArtist = {
  id: ARTIST_ID,
  libraryId: '00000000-0000-4000-8000-00000000f1f1',
  name: 'Sleep Token',
  hasImage: true,
  imageAlbumId: null,
  albumCount: 4,
  trackCount: 52,
  isFavourite: false,
};

const aPlaylist = (change: Partial<PlaylistSummary> = {}): PlaylistSummary => ({
  id: PLAYLIST_ID,
  name: 'Late Night',
  description: null,
  isShared: false,
  isOrdered: false,
  isMine: true,
  owner: { profileId: '00000000-0000-4000-8000-0000000000aa', name: 'Marques', colour: '#3a8ee8' },
  entryCount: 3,
  lostCount: 0,
  durationSeconds: 600,
  artworkAlbumIds: [],
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...change,
});

const anEntry = (n: number, track: ReturnType<typeof aTrack> | null, isGone = false) => ({
  id: `00000000-0000-4000-8000-${(900 + n).toString().padStart(12, '0')}`,
  position: n,
  addedAt: '2026-01-01T00:00:00.000Z',
  item: isGone
    ? null
    : {
        id: `00000000-0000-4000-8000-${(800 + n).toString().padStart(12, '0')}`,
        kind: 'song' as const,
        title: `Item ${n.toString()}`,
        subtitle: null,
        durationSeconds: 200,
        track,
      },
});

const read = async (view: ListenedView, seed: (cache: QueryClient) => void = () => undefined) => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });

  seed(cache);

  const held = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={cache}>{children}</QueryClientProvider>
  );

  const { result } = await renderHook(() => useCollection(view), { wrapper: held });

  return result.current;
};

describe('useCollection', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() => new Promise<Response>(() => undefined));
  });

  it('says nothing while the page is still being read', async () => {
    expect(await read({ kind: 'album', id: ALBUM_ID })).toBeNull();
  });

  it('asks only for the kind of page it is', async () => {
    await read({ kind: 'artist', id: ARTIST_ID });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(`/api/music/artists/${ARTIST_ID}`, expect.anything());
  });

  it('reads an album as its songs by its artist, with its year and how long it lasts', async () => {
    const tracks = [aTrack(1, { durationSeconds: 200 }), aTrack(2, { durationSeconds: 250 })];
    const collection = await read({ kind: 'album', id: ALBUM_ID }, (cache) => {
      cache.setQueryData(musicQueries.album(ALBUM_ID).queryKey, { album: anAlbum(), tracks });
    });

    expect(collection?.item).toEqual(
      expect.objectContaining({ kind: 'album', id: ALBUM_ID, title: 'Even In Arcadia' }),
    );
    expect(collection).toMatchObject({
      by: 'Sleep Token',
      facts: '2025 · 2 songs, 8 min',
      tracks,
      albums: [],
      source: { kind: 'album', id: ALBUM_ID, name: 'Even In Arcadia' },
      isOrdered: false,
      showsAlbum: false,
    });
  });

  it('leaves out the year of an album that has none, and says one song as one', async () => {
    const collection = await read({ kind: 'album', id: ALBUM_ID }, (cache) => {
      cache.setQueryData(musicQueries.album(ALBUM_ID).queryKey, {
        album: anAlbum({ year: null }),
        tracks: [aTrack(1, { durationSeconds: 29 })],
      });
    });

    expect(collection?.facts).toBe('1 song, 0 min');
  });

  it('gives the hours of a list an hour long or more', async () => {
    const tracks = Array.from({ length: 25 }, (_, at) => aTrack(at + 1, { durationSeconds: 180 }));
    const collection = await read({ kind: 'album', id: ALBUM_ID }, (cache) => {
      cache.setQueryData(musicQueries.album(ALBUM_ID).queryKey, {
        album: anAlbum({ year: null }),
        tracks,
      });
    });

    expect(collection?.facts).toBe('25 songs, 1 hr 15 min');
  });

  it('reads an artist as their most liked songs, ending with their albums and those they appear on', async () => {
    const popular = [aTrack(4), aTrack(5)];
    const own = anAlbum();
    const guest = anAlbum({ id: '00000000-0000-4000-8000-00000000a1b2', title: 'Guest Spot' });
    const collection = await read({ kind: 'artist', id: ARTIST_ID }, (cache) => {
      cache.setQueryData(musicQueries.artist(ARTIST_ID).queryKey, {
        artist: ARTIST,
        albums: [own],
        appearsOn: [guest],
        popular,
      });
    });

    expect(collection?.item).toEqual(
      expect.objectContaining({ kind: 'artist', title: 'Sleep Token' }),
    );
    expect(collection?.by).toBeNull();
    expect(collection?.facts).toBe('4 albums · 52 songs');
    expect(collection?.tracks).toBe(popular);
    expect(collection?.albums.map((album) => album.title)).toEqual([
      'Even In Arcadia',
      'Guest Spot',
    ]);
    expect(collection?.source).toEqual({ kind: 'artist', id: ARTIST_ID, name: 'Sleep Token' });
    expect(collection?.showsAlbum).toBe(true);
  });

  it('reads a playlist as the songs still on it, by whoever made it, in the order it keeps', async () => {
    const detail: PlaylistDetail = {
      playlist: aPlaylist({ isOrdered: true }),
      entries: [
        anEntry(1, aTrack(1)),
        anEntry(2, null),
        anEntry(3, null, true),
        anEntry(4, aTrack(4)),
      ],
    };
    const collection = await read({ kind: 'playlist', id: PLAYLIST_ID }, (cache) => {
      cache.setQueryData(musicQueries.playlist(PLAYLIST_ID).queryKey, detail);
    });

    expect(collection?.tracks).toEqual([aTrack(1), aTrack(4)]);
    expect(collection?.by).toBe('Marques');
    expect(collection?.facts).toBe('2 songs, 7 min');
    expect(collection?.isOrdered).toBe(true);
    expect(collection?.source).toEqual({ kind: 'playlist', id: PLAYLIST_ID, name: 'Late Night' });
    expect(collection?.showsAlbum).toBe(true);
  });

  it('names nobody for a playlist without an owner', async () => {
    const collection = await read({ kind: 'playlist', id: PLAYLIST_ID }, (cache) => {
      cache.setQueryData(musicQueries.playlist(PLAYLIST_ID).queryKey, {
        playlist: aPlaylist({ owner: null }),
        entries: [],
      });
    });

    expect(collection?.by).toBeNull();
    expect(collection?.facts).toBe('0 songs, 0 min');
  });

  it('reads the liked songs', async () => {
    const liked = [aTrack(7), aTrack(8)];
    const collection = await read({ kind: 'liked' }, (cache) => {
      cache.setQueryData(musicQueries.liked().queryKey, liked);
    });

    expect(collection).toEqual({
      item: LIKED_SONGS,
      by: null,
      facts: '2 songs, 7 min',
      tracks: liked,
      albums: [],
      source: { kind: 'liked', id: null, name: 'Liked Songs' },
      isOrdered: false,
      showsAlbum: true,
    });
  });
});
