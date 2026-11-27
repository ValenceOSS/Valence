import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, userEvent } from '@testing-library/react-native';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { Music } from '@ValenceTv/screens/Music/Music';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { aMusicAlbum } from '@ValenceTv/testing/aMusicAlbum';
import { aMusicArtist } from '@ValenceTv/testing/aMusicArtist';
import { aViewerProfile } from '@ValenceClient/testing/aViewerProfile';
import type { MusicAlbum, MusicArtist } from '@ValenceContracts/schemas/Music';
import type { MusicMixSummary } from '@ValenceContracts/schemas/MusicMix';
import type { PlaylistSummary } from '@ValenceContracts/schemas/Playlist';

const anId = (n: number) => `00000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;

const anAlbum = aMusicAlbum;

const anArtist = aMusicArtist;

const aPlaylist = (n: number, change: Partial<PlaylistSummary> = {}): PlaylistSummary => ({
  id: anId(300 + n),
  name: `Playlist ${n.toString()}`,
  description: null,
  isShared: false,
  isOrdered: false,
  isMine: true,
  owner: null,
  entryCount: 1,
  lostCount: 0,
  missingCount: 0,
  durationSeconds: 200,
  artworkAlbumIds: [],
  hasOwnArtwork: false,
  isSmart: false,
  rules: null,
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...change,
});

const aMix = (id: string, kind: MusicMixSummary['kind'], title: string): MusicMixSummary => ({
  id,
  kind,
  title,
  detail: 'Sleep Token and more',
  trackCount: 30,
  coverAlbumIds: [anId(101)],
  faces: [],
});

type Seed = {
  albums?: MusicAlbum[] | null;
  played?: MusicAlbum[];
  artists?: MusicArtist[];
  playlists?: PlaylistSummary[];
  mixes?: MusicMixSummary[];
  name?: string;
};

const draw = async (seed: Seed = {}) => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });
  const onOpen = jest.fn();
  const onFeature = jest.fn();

  if (seed.albums !== null) {
    cache.setQueryData(
      musicQueries.albums('recent').queryKey,
      seed.albums ?? [anAlbum(1), anAlbum(2)],
    );
  }

  cache.setQueryData(musicQueries.artists().queryKey, seed.artists ?? [anArtist(1)]);
  cache.setQueryData(musicQueries.playlists().queryKey, seed.playlists ?? [aPlaylist(1)]);
  cache.setQueryData(musicQueries.albums('played').queryKey, seed.played ?? []);
  cache.setQueryData(musicQueries.mixes().queryKey, seed.mixes ?? []);
  cache.setQueryData(
    profileQueries.watching().queryKey,
    seed.name === undefined ? null : aViewerProfile({ name: seed.name }),
  );

  const drawn = await render(
    <QueryClientProvider client={cache}>
      <Music onOpen={onOpen} onFeature={onFeature} upTo={null} />
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

  return { drawn, onOpen, onFeature };
};

const heroLinesIn = (drawn: Awaited<ReturnType<typeof draw>>['drawn']) =>
  drawn.container
    .queryAll((node) => node.type === 'Text')
    .slice(0, 2)
    .map((line) =>
      line.children.filter((part): part is string => typeof part === 'string').join(''),
    );

const heroIn = (drawn: Awaited<ReturnType<typeof draw>>['drawn']) => heroLinesIn(drawn)[0];

describe('Music', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() => new Promise<Response>(() => undefined));
  });

  it('waits while the albums are read', async () => {
    const { drawn } = await draw({ albums: null });

    expect(drawn.container.queryAll((node) => node.type === 'ActivityIndicator')).toHaveLength(1);
  });

  it('says so when there is no music yet', async () => {
    const { drawn } = await draw({ albums: [], playlists: [] });

    expect(drawn.getByText('No music yet')).toBeTruthy();
  });

  it('names the newest album large, lit by its picture, before the remote rests anywhere', async () => {
    const { drawn, onFeature } = await draw();

    expect(heroLinesIn(drawn)).toEqual(['Album 1', 'Sleep Token • Album']);
    expect(onFeature).toHaveBeenLastCalledWith(`/api/music/albums/${anId(101)}/artwork`);
  });

  it('names the page for music when there are only playlists', async () => {
    const { drawn, onFeature } = await draw({ albums: [] });

    expect(drawn.getByText('Music')).toBeTruthy();
    expect(onFeature).toHaveBeenLastCalledWith(null);
  });

  it('offers liked songs first, then playlists, then the newest albums, eight at most', async () => {
    const { drawn } = await draw({
      albums: Array.from({ length: 10 }, (_, at) => anAlbum(at + 1)),
      playlists: [aPlaylist(1), aPlaylist(2)],
    });
    const shortcuts = [
      'Liked Songs',
      'Playlist 1',
      'Playlist 2',
      'Album 1',
      'Album 2',
      'Album 3',
      'Album 4',
      'Album 5',
    ];

    for (const name of shortcuts) {
      expect(drawn.getByRole('button', { name })).toBeTruthy();
    }

    expect(drawn.queryByRole('button', { name: 'Album 6' })).toBeNull();
  });

  it('opens what is chosen', async () => {
    const { drawn, onOpen } = await draw();

    await userEvent.press(drawn.getByRole('button', { name: 'Playlist 1' }));

    expect(onOpen).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'playlist', id: anId(301), title: 'Playlist 1' }),
    );
  });

  it('shelves what was added lately, its own playlists after liked songs, and every artist', async () => {
    const { drawn } = await draw();

    expect(drawn.getByText('Recently added')).toBeTruthy();
    expect(drawn.getByText('Your playlists')).toBeTruthy();
    expect(drawn.getByText('Artists')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Artist 1, Artist' })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Liked Songs, All your liked songs' })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Playlist 1, Playlist' })).toBeTruthy();
  });

  it('shelves the playlists others shared apart from its own', async () => {
    const theirs = aPlaylist(2, {
      isMine: false,
      owner: { profileId: anId(9), name: 'Dan', colour: '#3a8ee8' },
    });
    const { drawn } = await draw({ playlists: [aPlaylist(1), theirs] });

    expect(drawn.getByText('Shared with you')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Playlist 2, Playlist • Dan' })).toBeTruthy();
    expect(drawn.queryByRole('button', { name: 'Playlist 2' })).toBeNull();
  });

  it('shelves what Valence made for this profile today, by name, its stations and its top mixes', async () => {
    const { drawn, onOpen } = await draw({
      name: 'Marques',
      mixes: [
        aMix('daily-1', 'daily', 'Daily Mix 1'),
        aMix('station-1', 'station', 'Sleep Token Radio'),
        aMix('genre-metal', 'genre', 'Metal Mix'),
      ],
    });

    expect(drawn.getByText('Made for Marques')).toBeTruthy();
    expect(drawn.getByText('Recommended stations')).toBeTruthy();
    expect(drawn.getByText('Your top mixes')).toBeTruthy();

    await userEvent.press(
      drawn.getByRole('button', { name: 'Sleep Token Radio, Sleep Token and more' }),
    );

    expect(onOpen).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'mix', view: { kind: 'mix', id: 'station-1' } }),
    );
  });

  it('says the mixes are made for you where it does not know who is listening', async () => {
    const { drawn } = await draw({ mixes: [aMix('daily-1', 'daily', 'Daily Mix 1')] });

    expect(drawn.getByText('Made for you')).toBeTruthy();
  });

  it('shelves what was played lately, the artists played most and albums it might like', async () => {
    const played = aMusicArtist(5);
    const byPlayed = (n: number) => anAlbum(n, { artist: { id: played.id, name: played.name } });
    const { drawn } = await draw({
      albums: [anAlbum(1), byPlayed(2), byPlayed(3)],
      played: [byPlayed(3)],
      artists: [anArtist(1), played],
    });

    expect(drawn.getByText('Recents')).toBeTruthy();
    expect(drawn.getByText('Your top artists')).toBeTruthy();
    expect(drawn.getAllByRole('button', { name: 'Artist 5, Artist' })).toHaveLength(2);
    expect(drawn.getByText('Albums you might like')).toBeTruthy();
    expect(drawn.getAllByRole('button', { name: 'Album 2, Artist 5 • Album' })).toHaveLength(2);
    expect(drawn.getAllByRole('button', { name: 'Album 3, Artist 5 • Album' })).toHaveLength(2);
  });

  it('leaves out a shelf with nothing on it', async () => {
    const { drawn } = await draw({ artists: [], playlists: [] });

    expect(drawn.queryByText('Artists')).toBeNull();
    expect(drawn.queryByText('Shared with you')).toBeNull();
    expect(drawn.queryByText('Recents')).toBeNull();
    expect(drawn.queryByText('Made for you')).toBeNull();
    expect(drawn.getByText('Recently added')).toBeTruthy();
  });

  it('offers the artists it follows among the shortcuts, after its own playlists', async () => {
    const { drawn } = await draw({
      artists: [anArtist(1, { isFavourite: true })],
      playlists: [aPlaylist(1)],
    });

    expect(drawn.getByRole('button', { name: 'Artist 1' })).toBeTruthy();
  });

  describe('where the remote rests', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('lights the page by what the remote rests on, once it has rested a moment', async () => {
      const { drawn, onFeature } = await draw();

      expect(heroIn(drawn)).toBe('Album 1');

      await fireEvent(drawn.getByRole('button', { name: 'Playlist 1' }), 'focus');
      await act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(heroIn(drawn)).toBe('Album 1');

      await act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(heroIn(drawn)).toBe('Playlist 1');
      expect(onFeature).toHaveBeenLastCalledWith(null);
    });

    it('only lights the page by the last thing rested on when the remote moves quickly', async () => {
      const { drawn, onFeature } = await draw();

      await fireEvent(drawn.getByRole('button', { name: 'Playlist 1' }), 'focus');
      await act(() => {
        jest.advanceTimersByTime(200);
      });
      await fireEvent(drawn.getByRole('button', { name: 'Album 2' }), 'focus');
      await act(() => {
        jest.advanceTimersByTime(400);
      });

      expect(heroIn(drawn)).toBe('Album 2');
      expect(onFeature).not.toHaveBeenCalledWith(null);
      expect(onFeature).toHaveBeenLastCalledWith(`/api/music/albums/${anId(102)}/artwork`);
    });

    it('rests on what is on the shelves too', async () => {
      const { drawn } = await draw();

      await fireEvent(drawn.getByRole('button', { name: 'Artist 1, Artist' }), 'focus');
      await act(() => {
        jest.advanceTimersByTime(400);
      });

      expect(heroIn(drawn)).toBe('Artist 1');
    });
  });
});
