import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { MusicCollection } from '@ValenceTv/screens/MusicCollection/MusicCollection';
import { aFakeMusicPlayer } from '@ValenceTv/testing/aFakeMusicPlayer';
import type { MusicPlayer, MusicPlayerState } from '@ValenceClient/music/createMusicPlayer';
import type { MusicAlbum, MusicArtist } from '@ValenceContracts/schemas/Music';
import type { PlaylistSummary } from '@ValenceContracts/schemas/Playlist';
import type { ListenedView } from '@ValenceTv/music/ListenedView';

const mockHeld: { player: MusicPlayer | null } = { player: null };

jest.mock('@ValenceClient/music/theMusicPlayer', () => ({
  theMusicPlayer: () => {
    if (mockHeld.player === null) {
      throw new Error('No player was set up for the test.');
    }

    return mockHeld.player;
  },
}));

const aPlayer = (start: Partial<MusicPlayerState> = {}) => {
  const { player } = aFakeMusicPlayer(start);

  mockHeld.player = player;

  return player;
};

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
  hasImage: false,
  imageAlbumId: null,
  albumCount: 1,
  trackCount: 2,
  isFavourite: false,
};

const PLAYLIST: PlaylistSummary = {
  id: PLAYLIST_ID,
  name: 'In Order',
  description: null,
  isShared: false,
  isOrdered: true,
  isMine: true,
  owner: null,
  entryCount: 0,
  lostCount: 0,
  durationSeconds: 0,
  artworkAlbumIds: [],
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const TRACKS = [
  aTrack(1, { title: 'Look To Windward' }),
  aTrack(2, { title: 'Emergence' }),
  aTrack(3, { title: 'Past Self' }),
];

const draw = async (view: ListenedView, seed: (cache: QueryClient) => void) => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });
  const onPlayed = jest.fn();
  const onOpen = jest.fn();
  const onLight = jest.fn();

  seed(cache);

  const drawn = await render(
    <QueryClientProvider client={cache}>
      <MusicCollection view={view} onPlayed={onPlayed} onOpen={onOpen} onLight={onLight} />
    </QueryClientProvider>,
  );

  const [page] = drawn.container.queryAll(
    (node) => node.type === 'View' && typeof node.props.onLayout === 'function',
  );

  if (page !== undefined) {
    await fireEvent(page, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 1920, height: 1080 } },
    });
  }

  return { drawn, onPlayed, onOpen, onLight };
};

const anAlbumPage = (cache: QueryClient) => {
  cache.setQueryData(musicQueries.album(ALBUM_ID).queryKey, { album: anAlbum(), tracks: TRACKS });
};

describe('MusicCollection', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() => new Promise<Response>(() => undefined));
  });

  it('waits while the page is read', async () => {
    aPlayer();

    const { drawn, onLight } = await draw({ kind: 'album', id: ALBUM_ID }, () => undefined);

    expect(drawn.container.queryAll((node) => node.type === 'ActivityIndicator')).toHaveLength(1);
    expect(onLight).toHaveBeenCalledWith(null);
  });

  it('shows what it is, by whom, and how long it lasts, lit by its own picture', async () => {
    aPlayer();

    const { drawn, onLight } = await draw({ kind: 'album', id: ALBUM_ID }, anAlbumPage);

    expect(drawn.getByText('Album')).toBeTruthy();
    expect(drawn.getByText('Even In Arcadia')).toBeTruthy();
    expect(drawn.getAllByText('Sleep Token')).toHaveLength(1 + TRACKS.length);
    expect(drawn.getByText('2025 · 3 songs, 10 min')).toBeTruthy();
    expect(onLight).toHaveBeenLastCalledWith(`/api/music/albums/${ALBUM_ID}/artwork`);
  });

  it('plays it from the start and opens what is playing', async () => {
    const player = aPlayer();
    const { drawn, onPlayed } = await draw({ kind: 'album', id: ALBUM_ID }, anAlbumPage);

    await userEvent.press(drawn.getByRole('button', { name: 'Play' }));

    expect(player.play).toHaveBeenCalledWith(TRACKS, 0, {
      source: { kind: 'album', id: ALBUM_ID, name: 'Even In Arcadia' },
      isOrdered: false,
      isShuffled: false,
    });
    expect(onPlayed).toHaveBeenCalledTimes(1);
  });

  it('shuffles it from a song picked at random', async () => {
    const player = aPlayer();
    const random = jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const { drawn } = await draw({ kind: 'album', id: ALBUM_ID }, anAlbumPage);

    await userEvent.press(drawn.getByRole('button', { name: 'Shuffle' }));

    expect(player.play).toHaveBeenCalledWith(
      TRACKS,
      1,
      expect.objectContaining({ isShuffled: true }),
    );

    random.mockRestore();
  });

  it('lists every song, and plays the list from the one chosen', async () => {
    const player = aPlayer();
    const { drawn, onPlayed } = await draw({ kind: 'album', id: ALBUM_ID }, anAlbumPage);

    await userEvent.press(drawn.getByRole('button', { name: 'Past Self, Sleep Token' }));

    expect(player.play).toHaveBeenCalledWith(
      TRACKS,
      2,
      expect.objectContaining({ isShuffled: false }),
    );
    expect(onPlayed).toHaveBeenCalledTimes(1);
  });

  it('marks the song that is playing in place of its number', async () => {
    aPlayer({ current: TRACKS[1] ?? null, isPlaying: true });

    const { drawn } = await draw({ kind: 'album', id: ALBUM_ID }, anAlbumPage);

    expect(drawn.getByText('1')).toBeTruthy();
    expect(drawn.queryByText('2')).toBeNull();
    expect(drawn.getByText('3')).toBeTruthy();
  });

  it('holds off shuffle for a playlist that keeps its order, and plays it in that order', async () => {
    const player = aPlayer();
    const { drawn } = await draw({ kind: 'playlist', id: PLAYLIST_ID }, (cache) => {
      cache.setQueryData(musicQueries.playlist(PLAYLIST_ID).queryKey, {
        playlist: PLAYLIST,
        entries: TRACKS.map((track, at) => ({
          id: `00000000-0000-4000-8000-${(900 + at).toString().padStart(12, '0')}`,
          position: at,
          addedAt: '2026-01-01T00:00:00.000Z',
          item: {
            id: track.id,
            kind: 'song' as const,
            title: track.title,
            subtitle: null,
            durationSeconds: track.durationSeconds,
            track,
          },
        })),
      });
    });

    expect(drawn.getByText('Playlist')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Shuffle' })).toBeDisabled();

    await userEvent.press(drawn.getByRole('button', { name: 'Play' }));

    expect(player.play).toHaveBeenCalledWith(
      TRACKS,
      0,
      expect.objectContaining({ isOrdered: true }),
    );
  });

  it('holds off both buttons for a list with no songs', async () => {
    const player = aPlayer();
    const { drawn, onPlayed } = await draw({ kind: 'playlist', id: PLAYLIST_ID }, (cache) => {
      cache.setQueryData(musicQueries.playlist(PLAYLIST_ID).queryKey, {
        playlist: { ...PLAYLIST, isOrdered: false },
        entries: [],
      });
    });

    expect(drawn.getByRole('button', { name: 'Play' })).toBeDisabled();
    expect(drawn.getByRole('button', { name: 'Shuffle' })).toBeDisabled();

    await userEvent.press(drawn.getByRole('button', { name: 'Play' }));

    expect(player.play).not.toHaveBeenCalled();
    expect(onPlayed).not.toHaveBeenCalled();
  });

  it('ends an artist with their albums, and opens the one chosen', async () => {
    aPlayer();

    const { drawn, onOpen } = await draw({ kind: 'artist', id: ARTIST_ID }, (cache) => {
      cache.setQueryData(musicQueries.artist(ARTIST_ID).queryKey, {
        artist: ARTIST,
        albums: [anAlbum()],
        appearsOn: [],
        popular: TRACKS.slice(0, 2),
      });
    });

    expect(drawn.getByText('Artist')).toBeTruthy();
    expect(drawn.getByText('1 albums · 2 songs')).toBeTruthy();

    expect(drawn.getByText('Albums')).toBeTruthy();

    await userEvent.press(
      drawn.getByRole('button', { name: 'Even In Arcadia, Sleep Token • Album' }),
    );

    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ kind: 'album', id: ALBUM_ID }));
  });

  it('calls liked songs a playlist', async () => {
    aPlayer();

    const { drawn } = await draw({ kind: 'liked' }, (cache) => {
      cache.setQueryData(musicQueries.liked().queryKey, TRACKS);
    });

    expect(drawn.getByText('Playlist')).toBeTruthy();
    expect(drawn.getByText('Liked Songs')).toBeTruthy();
  });
});
