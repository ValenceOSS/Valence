import { createElement as mockCreateElement, useEffect as mockUseEffect } from 'react';
import { TextInput as mockTextInput, View as mockView } from 'react-native';
import { render, userEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { Search } from '@ValenceTv/screens/Search/Search';
import type { ReactNode } from 'react';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const mockPlay = jest.fn();

jest.mock('@ValenceClient/session/auth', () => ({
  fetchSession: () => new Promise(() => undefined),
}));

jest.mock('@ValenceClient/music/theMusicPlayer', () => ({
  theMusicPlayer: () => ({ play: mockPlay }),
}));

jest.mock('@ValenceTv/components/SystemSearch/SystemSearch', () => ({
  SystemSearch: ({
    placeholder,
    onChangeText,
    onResultsLayout,
    children,
  }: {
    placeholder: string;
    onChangeText: (text: string) => void;
    onResultsLayout: (size: { width: number; height: number }) => void;
    children: ReactNode;
  }) => {
    mockUseEffect(() => {
      onResultsLayout({ width: 1920, height: 800 });
    }, [onResultsLayout]);

    return mockCreateElement(
      mockView,
      null,
      mockCreateElement(mockTextInput, { placeholder, onChangeText }),
      children,
    );
  },
}));

const LIBRARY = '00000000-0000-4000-8000-0000000000aa';

const aMedia = (overrides: Partial<MediaSummary> = {}): MediaSummary => ({
  id: '00000000-0000-4000-8000-000000000001',
  libraryId: LIBRARY,
  title: 'Dune',
  year: 2021,
  durationSeconds: 9360,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-09-19T00:00:00.000Z',
  hasPoster: true,
  hasBackdrop: true,
  hasLogo: false,
  seriesId: null,
  ...overrides,
});

const aTitle = (overrides: Partial<CatalogueTitle> = {}): CatalogueTitle => ({
  kind: 'film',
  id: '841',
  title: 'Dune (1984)',
  subtitle: null,
  year: 1984,
  overview: null,
  posterUrl: '/posters/dune-1984.jpg',
  standing: { status: 'askable', mediaId: null, requestId: null, requestState: null },
  ...overrides,
});

type Held = {
  mayRequest?: boolean;
  library?: MediaSummary[];
  films?: CatalogueTitle[];
  shows?: CatalogueTitle[];
  songs?: ReturnType<typeof aTrack>[];
  shelves?: { id: string; title: string; titles: CatalogueTitle[] }[];
};

const aCacheHolding = (asked: string, held: Held): QueryClient => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });

  cache.setQueryData(requestsQueries.availability().queryKey, {
    isEnabled: held.mayRequest ?? false,
  });
  cache.setQueryData(sessionQueries.permissions().queryKey, {
    permissions: ['requests.ask'],
    isAdministrator: false,
  });
  if (held.shelves !== undefined) {
    cache.setQueryData(requestsQueries.discover().queryKey, {
      shelves: held.shelves.map((shelf) => ({ ...shelf, browse: null })),
      studios: [],
    });
  }
  cache.setQueryData(
    libraryQueries.across([LIBRARY], { search: asked, limit: 60 }).queryKey,
    held.library ?? [],
  );
  cache.setQueryData(requestsQueries.askableSearch(asked, 'film').queryKey, held.films ?? []);
  cache.setQueryData(requestsQueries.askableSearch(asked, 'series').queryKey, held.shows ?? []);
  cache.setQueryData(musicQueries.search(asked).queryKey, {
    tracks: held.songs ?? [],
    albums: [],
    artists: [],
    playlists: [],
  });

  return cache;
};

type Told = {
  hasMusic?: boolean;
  onOpen?: (media: MediaSummary) => void;
  onAsk?: (title: CatalogueTitle) => void;
  onFeature?: (path: string | null) => void;
  onPlayedMusic?: () => void;
};

const drawSearch = (cache: QueryClient, told: Told = {}) =>
  render(
    <QueryClientProvider client={cache}>
      <Search
        watchable={[LIBRARY]}
        onOpen={told.onOpen ?? jest.fn()}
        onAsk={told.onAsk ?? jest.fn()}
        onFeature={told.onFeature ?? jest.fn()}
        upTo={null}
        hasMusic={told.hasMusic ?? false}
        onOpenMusic={jest.fn()}
        onPlayedMusic={told.onPlayedMusic ?? jest.fn()}
      />
    </QueryClientProvider>,
  );

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => undefined));
  mockPlay.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Search', () => {
  it('says what can be searched for', async () => {
    const films = await drawSearch(aCacheHolding('', {}));

    expect(films.getByPlaceholderText('Films and shows')).toBeTruthy();

    const music = await drawSearch(aCacheHolding('', {}), { hasMusic: true });

    expect(music.getByPlaceholderText('Films, shows and music')).toBeTruthy();
  });

  it('shows the shelves of things to ask for before anything is typed, lit by the first poster', async () => {
    const onFeature = jest.fn();
    const onAsk = jest.fn();
    const trending = aTitle({ id: '1', title: 'Trending film', posterUrl: '/posters/one.jpg' });
    const drawn = await drawSearch(
      aCacheHolding('', {
        mayRequest: true,
        shelves: [
          {
            id: 'music',
            title: 'Trending music',
            titles: [aTitle({ kind: 'album', id: '9', title: 'An album' })],
          },
          { id: 'trending', title: 'Trending', titles: [trending] },
        ],
      }),
      { onFeature, onAsk },
    );

    expect(drawn.queryByText('Trending music')).toBeNull();
    expect(drawn.getByText('Trending')).toBeTruthy();
    expect(onFeature).toHaveBeenCalledWith('/posters/one.jpg');

    await userEvent.press(drawn.getByRole('button', { name: 'Trending film' }));

    expect(onAsk).toHaveBeenCalledWith(trending);
  });

  it('asks for the shelves only for somebody who may ask for things', async () => {
    const asking = jest.spyOn(global, 'fetch');

    await drawSearch(aCacheHolding('', { mayRequest: false }));

    expect(asking).not.toHaveBeenCalledWith('/api/requests/discover', expect.anything());

    await drawSearch(aCacheHolding('', { mayRequest: true }));

    expect(asking).toHaveBeenCalledWith('/api/requests/discover', expect.anything());
  });

  it('finds what the library has by name and opens it', async () => {
    const dune = aMedia();
    const onOpen = jest.fn();
    const drawn = await drawSearch(aCacheHolding('dune', { library: [dune] }), { onOpen });

    await userEvent.type(drawn.getByPlaceholderText('Films and shows'), 'dune');

    await userEvent.press(await drawn.findByRole('button', { name: 'Dune' }));

    expect(onOpen).toHaveBeenCalledWith(dune);
    expect(drawn.queryByText('In your library')).toBeNull();
  });

  it('follows what the library has with what it lacks, to be asked for', async () => {
    const lacking = aTitle();
    const onAsk = jest.fn();
    const drawn = await drawSearch(
      aCacheHolding('dune', {
        mayRequest: true,
        library: [aMedia()],
        films: [
          lacking,
          aTitle({
            id: '438631',
            title: 'Dune',
            standing: { status: 'library', mediaId: 'x', requestId: null, requestState: null },
          }),
        ],
      }),
      { onAsk },
    );

    await userEvent.type(drawn.getByPlaceholderText('Films and shows'), 'dune');

    expect(await drawn.findByText('In your library')).toBeTruthy();
    expect(drawn.getByText('Not in your library yet')).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Dune (1984)' }));

    expect(onAsk).toHaveBeenCalledWith(lacking);
  });

  it('says so when nothing is called what was typed', async () => {
    const drawn = await drawSearch(aCacheHolding('zzz', {}));

    await userEvent.type(drawn.getByPlaceholderText('Films and shows'), 'zzz');

    expect(await drawn.findByText('Nothing called “zzz” here.')).toBeTruthy();
  });

  it('plays a song that was found', async () => {
    const song = aTrack(1, { title: 'Dune Song' });
    const onPlayedMusic = jest.fn();
    const drawn = await drawSearch(aCacheHolding('dune', { songs: [song] }), {
      hasMusic: true,
      onPlayedMusic,
    });

    await userEvent.type(drawn.getByPlaceholderText('Films, shows and music'), 'dune');

    expect(await drawn.findByText('Songs')).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Dune Song, Sleep Token' }));

    expect(mockPlay).toHaveBeenCalledWith([song], 0, {
      source: { kind: 'search', id: null, name: 'dune' },
    });
    expect(onPlayedMusic).toHaveBeenCalledTimes(1);
  });
});
