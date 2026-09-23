import { createElement as mockCreateElement } from 'react';
import { BackHandler, Linking, Text as mockText, View as mockView } from 'react-native';
import { act, render, userEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { emitPresenceEvent } from '@ValenceClient/presence/presenceEvents';
import { LibrarySchema, MediaDetailSchema } from '@ValenceContracts/schemas/Library';
import { MusicAlbumSchema } from '@ValenceContracts/schemas/Music';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { Button as mockButton } from '@ValenceTv/components/Button/Button';
import { SignedIn } from '@ValenceTv/screens/SignedIn/SignedIn';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { Tab } from '@ValenceTv/navigation/Tab';

const mockStandIn = (name: string, presses: Record<string, () => void> = {}) =>
  mockCreateElement(
    mockView,
    null,
    mockCreateElement(mockText, null, name),
    ...Object.entries(presses).map(([label, onPress]) =>
      mockCreateElement(mockButton, { key: label, label, onPress }),
    ),
  );

const mockMusic = {
  leave: jest.fn(),
  pause: jest.fn(),
  toggle: jest.fn(),
  read: () => ({ current: null, remote: null }),
};

const LIBRARY = '00000000-0000-4000-8000-0000000000aa';

const aMedia = (overrides: Partial<MediaSummary> = {}): MediaSummary => ({
  id: '00000000-0000-4000-8000-000000000001',
  libraryId: LIBRARY,
  title: 'Arrival',
  year: 2016,
  durationSeconds: 6960,
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

const mockArrival = aMedia();

const mockEpisode = aMedia({
  id: '00000000-0000-4000-8000-000000000002',
  title: 'Half Loop',
  seriesId: 'severance',
  seriesTitle: 'Severance',
});

const mockRequest: MediaRequest = aMediaRequest({ tmdbId: 438631 });

const mockAskable: CatalogueTitle = {
  kind: 'film',
  id: '841',
  title: 'Dune (1984)',
  subtitle: null,
  year: 1984,
  overview: null,
  posterUrl: null,
  standing: { status: 'askable', mediaId: null, requestId: null, requestState: null },
};

const mockHad: CatalogueTitle = {
  ...mockAskable,
  standing: { status: 'library', mediaId: mockArrival.id, requestId: null, requestState: null },
};

jest.mock('@ValenceClient/session/auth', () => ({
  fetchSession: () => new Promise(() => undefined),
}));

jest.mock('@ValenceClient/query/useFreshFromTheSocket', () => ({
  useFreshFromTheSocket: () => undefined,
}));

jest.mock('@ValenceClient/realtime/getRealtimeClient', () => ({ getRealtimeClient: () => null }));

jest.mock('@ValenceClient/presence/watchPresence', () => ({
  watchPresence: () => () => undefined,
}));

jest.mock('@ValenceClient/music/useMusicRemote', () => ({ useMusicRemote: () => undefined }));

jest.mock('@ValenceClient/music/theMusicPlayer', () => ({ theMusicPlayer: () => mockMusic }));

jest.mock('@ValenceTv/music/useSystemNowPlaying', () => ({
  useSystemNowPlaying: () => undefined,
}));

jest.mock('@ValenceTv/notifications/useArrivals', () => ({
  useArrivals: () => ({ arrival: null, dismiss: () => undefined }),
}));

jest.mock('@ValenceTv/components/MoodBackdrop/MoodBackdrop', () => ({
  MoodBackdrop: ({ path }: { path: string | null }) => mockStandIn(`Lit by ${path ?? 'nothing'}`),
}));

jest.mock('@ValenceTv/components/NowPlayingChip/NowPlayingChip', () => ({
  NowPlayingChip: ({ onOpen }: { onOpen: () => void }) =>
    mockStandIn('Chip', { 'Open what is playing': onOpen }),
}));

jest.mock('@ValenceTv/components/TopBar/TopBar', () => ({
  TopBar: ({ onChoose, hasMusic }: { onChoose: (tab: Tab) => void; hasMusic: boolean }) =>
    mockStandIn(hasMusic ? 'Bar with music' : 'Bar', {
      'Go to Films': () => {
        onChoose('films');
      },
      'Go to Search': () => {
        onChoose('search');
      },
      'Go to Account': () => {
        onChoose('account');
      },
    }),
}));

jest.mock('@ValenceTv/screens/Home/Home', () => ({
  Home: ({
    watchable,
    onOpen,
    onPlay,
    onFeature,
  }: {
    watchable: readonly string[];
    onOpen: (media: MediaSummary) => void;
    onPlay: (media: MediaSummary, startSeconds: number) => void;
    onFeature: (media: MediaSummary) => void;
  }) =>
    mockStandIn(`Home of ${watchable.join(', ')}`, {
      'Open Arrival': () => {
        onOpen(mockArrival);
      },
      'Open an episode': () => {
        onOpen(mockEpisode);
      },
      'Play Arrival': () => {
        onPlay(mockArrival, 30);
      },
      'Feature Arrival': () => {
        onFeature(mockArrival);
      },
    }),
}));

jest.mock('@ValenceTv/screens/Catalogue/Catalogue', () => ({
  Catalogue: ({ kind }: { kind: string }) => mockStandIn(`Catalogue of ${kind}`),
}));

jest.mock('@ValenceTv/screens/Account/Account', () => ({
  Account: ({
    onRequests,
    onOpenRequest,
    onChangeServer,
  }: {
    onRequests: () => void;
    onOpenRequest: (request: MediaRequest) => void;
    onChangeServer: () => void;
  }) =>
    mockStandIn('Account', {
      'All requests': onRequests,
      'Open my request': () => {
        onOpenRequest(mockRequest);
      },
      'Change server': onChangeServer,
    }),
}));

jest.mock('@ValenceTv/screens/Search/Search', () => ({
  Search: ({ onAsk }: { onAsk: (title: CatalogueTitle) => void }) =>
    mockStandIn('Search', {
      'Ask for Dune': () => {
        onAsk(mockAskable);
      },
      'Ask for one we have': () => {
        onAsk(mockHad);
      },
    }),
}));

jest.mock('@ValenceTv/screens/FilmPage/FilmPage', () => ({
  FilmPage: ({
    mediaId,
    onPlay,
  }: {
    mediaId: string;
    onPlay: (media: MediaSummary, startSeconds: number) => void;
  }) =>
    mockStandIn(`Film ${mediaId}`, {
      'Play the film': () => {
        onPlay(mockArrival, 0);
      },
    }),
}));

jest.mock('@ValenceTv/screens/ShowPage/ShowPage', () => ({
  ShowPage: ({ libraryId, showId }: { libraryId: string; showId: string }) =>
    mockStandIn(`Show ${showId} in ${libraryId}`),
}));

jest.mock('@ValenceTv/screens/AskPage/AskPage', () => ({
  AskPage: ({ kind, id }: { kind: string; id: string }) => mockStandIn(`Ask for ${kind} ${id}`),
}));

jest.mock('@ValenceTv/screens/RequestsPage/RequestsPage', () => ({
  RequestsPage: () => mockStandIn('Requests'),
}));

jest.mock('@ValenceTv/screens/Music/Music', () => ({ Music: () => mockStandIn('Music') }));

jest.mock('@ValenceTv/screens/MusicCollection/MusicCollection', () => ({
  MusicCollection: () => mockStandIn('Music collection'),
}));

jest.mock('@ValenceTv/screens/NowPlaying/NowPlaying', () => ({
  NowPlaying: () => mockStandIn('Now playing'),
}));

jest.mock('@ValenceTv/screens/Player/Player', () => ({
  Player: ({
    mediaId,
    startSeconds,
    onLeave,
  }: {
    mediaId: string;
    startSeconds: number;
    onLeave: () => void;
  }) =>
    mockStandIn(`Playing ${mediaId} from ${startSeconds.toString()}`, { 'Stop playing': onLeave }),
}));

const USER = { id: 'me', name: 'Marques', email: 'marques@example.com', emailVerified: true };

const aLibrary = (id: string, kind: 'movies' | 'shows' | 'music') =>
  LibrarySchema.parse({
    id,
    name: kind,
    kind,
    path: `/media/${kind}`,
    itemCount: 1,
    lastScannedAt: null,
    defaultAudioLanguage: null,
    filesAtOnce: null,
  });

const FILMS = '00000000-0000-4000-8000-0000000000f1';

const SHOWS = '00000000-0000-4000-8000-0000000000f2';

const SONGS = '00000000-0000-4000-8000-0000000000f3';

const AN_ALBUM = MusicAlbumSchema.parse({
  id: '00000000-0000-4000-8000-0000000000b1',
  libraryId: SONGS,
  title: 'Take Me Back To Eden',
  artist: { id: '00000000-0000-4000-8000-0000000000b2', name: 'Sleep Token' },
  year: 2023,
  genres: [],
  hasArtwork: true,
  isCompilation: false,
  trackCount: 12,
  durationSeconds: 3600,
  sizeBytes: 1,
  isExplicit: false,
  addedAt: '2026-09-23T00:00:00.000Z',
});

const aCache = ({ withMusic = false }: { withMusic?: boolean } = {}): QueryClient => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });

  cache.setQueryData(libraryQueries.all().queryKey, [
    aLibrary(FILMS, 'movies'),
    aLibrary(SHOWS, 'shows'),
    ...(withMusic ? [aLibrary(SONGS, 'music')] : []),
  ]);
  cache.setQueryData(profileQueries.watching().queryKey, null);
  cache.setQueryData(musicQueries.albums('recent').queryKey, withMusic ? [AN_ALBUM] : []);

  return cache;
};

const drawSignedIn = (cache: QueryClient = aCache(), told: { onChangeServer?: () => void } = {}) =>
  render(
    <QueryClientProvider client={cache}>
      <SignedIn
        user={USER}
        onChangeServer={told.onChangeServer ?? jest.fn()}
        isArriving={false}
        onFaceAt={jest.fn()}
        onMarkAt={jest.fn()}
      />
    </QueryClientProvider>,
  );

let pressMenu: () => void = () => undefined;

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => undefined));
  jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_, heard) => {
    pressMenu = () => {
      heard({ type: 'hardwareBackPress', timeStamp: 0 });
    };

    return { remove: () => undefined };
  });
  mockMusic.leave.mockClear();
  mockMusic.pause.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
  pressMenu = () => undefined;
});

describe('SignedIn', () => {
  it('starts on the front page, of the libraries holding something to watch', async () => {
    const drawn = await drawSignedIn(aCache({ withMusic: true }));

    expect(drawn.getByText(`Home of ${FILMS}, ${SHOWS}`)).toBeTruthy();
    expect(drawn.getByText('Bar with music')).toBeTruthy();
  });

  it('offers music only where there is some to listen to', async () => {
    const drawn = await drawSignedIn(aCache({ withMusic: false }));

    expect(drawn.getByText('Bar')).toBeTruthy();
  });

  it('shows the part chosen in the bar', async () => {
    const drawn = await drawSignedIn();

    expect(drawn.queryByText('Catalogue of films')).toBeNull();

    await userEvent.press(drawn.getByRole('button', { name: 'Go to Films' }));

    expect(drawn.getByText('Catalogue of films')).toBeTruthy();
  });

  it('opens a film’s page over the front page, and goes back with Menu', async () => {
    const drawn = await drawSignedIn();

    await userEvent.press(drawn.getByRole('button', { name: 'Open Arrival' }));

    expect(drawn.getByText(`Film ${mockArrival.id}`)).toBeTruthy();
    expect(drawn.getByText(`Lit by /api/media/${mockArrival.id}/image/backdrop`)).toBeTruthy();

    await act(() => {
      pressMenu();
    });

    expect(drawn.queryByText(`Film ${mockArrival.id}`)).toBeNull();
  });

  it('opens a programme for an episode', async () => {
    const drawn = await drawSignedIn();

    await userEvent.press(drawn.getByRole('button', { name: 'Open an episode' }));

    expect(drawn.getByText(`Show severance in ${LIBRARY}`)).toBeTruthy();
  });

  it('plays over everything, pausing music, and goes back to where it was when it ends', async () => {
    const drawn = await drawSignedIn();

    await userEvent.press(drawn.getByRole('button', { name: 'Open Arrival' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Play the film' }));

    expect(drawn.getByText(`Playing ${mockArrival.id} from 0`)).toBeTruthy();
    expect(drawn.queryByRole('button', { name: 'Open what is playing' })).toBeNull();
    expect(mockMusic.pause).toHaveBeenCalled();

    await userEvent.press(drawn.getByRole('button', { name: 'Stop playing' }));

    expect(drawn.getByText(`Film ${mockArrival.id}`)).toBeTruthy();
  });

  it('lights the front page with the title its top is showing', async () => {
    const drawn = await drawSignedIn();

    expect(drawn.getByText('Lit by nothing')).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Feature Arrival' }));

    expect(drawn.getByText(`Lit by /api/media/${mockArrival.id}/image/backdrop`)).toBeTruthy();
  });

  it('opens a page to ask for what the library lacks, and the library’s own page for what it has', async () => {
    const drawn = await drawSignedIn();

    await userEvent.press(drawn.getByRole('button', { name: 'Go to Search' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Ask for Dune' }));

    expect(drawn.getByText('Ask for film 841')).toBeTruthy();

    await act(() => {
      pressMenu();
    });
    await userEvent.press(drawn.getByRole('button', { name: 'Ask for one we have' }));

    expect(drawn.getByText(`Film ${mockArrival.id}`)).toBeTruthy();
  });

  it('opens every request, and one of this viewer’s own to ask about, from the profile', async () => {
    const drawn = await drawSignedIn();

    await userEvent.press(drawn.getByRole('button', { name: 'Go to Account' }));
    await userEvent.press(drawn.getByRole('button', { name: 'All requests' }));

    expect(drawn.getByText('Requests')).toBeTruthy();

    await act(() => {
      pressMenu();
    });
    await userEvent.press(drawn.getByRole('button', { name: 'Open my request' }));

    expect(drawn.getByText('Ask for film 438631')).toBeTruthy();
  });

  it('hands moving to another server up from the profile', async () => {
    const onChangeServer = jest.fn();
    const drawn = await drawSignedIn(aCache(), { onChangeServer });

    await userEvent.press(drawn.getByRole('button', { name: 'Go to Account' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Change server' }));

    expect(onChangeServer).toHaveBeenCalledTimes(1);
  });

  it('plays a film sent from another device straight away', async () => {
    const drawn = await drawSignedIn();

    await act(() => {
      emitPresenceEvent({
        kind: 'video',
        command: { kind: 'play', mediaId: mockArrival.id, startSeconds: 42.7 },
        fromClientId: 'phone',
        fromLabel: 'Phone',
      });
    });

    expect(drawn.getByText(`Playing ${mockArrival.id} from 42`)).toBeTruthy();
  });

  it('opens a title chosen on the television’s top shelf', async () => {
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(`valence://open/film/${mockArrival.id}`);

    const drawn = await drawSignedIn();

    expect(await drawn.findByText(`Film ${mockArrival.id}`)).toBeTruthy();
  });

  it('opens a programme from the top shelf by its episode', async () => {
    const cache = aCache();

    cache.setQueryData(
      libraryQueries.detail(mockEpisode.id).queryKey,
      MediaDetailSchema.parse({
        id: mockEpisode.id,
        libraryId: LIBRARY,
        title: 'Half Loop',
        container: 'mkv',
        durationSeconds: 3300,
        videoCodec: 'h264',
        videoRange: 'SDR',
        width: 1920,
        height: 1080,
        bitrateKbps: 8000,
        audioStreams: [{ index: 1, codec: 'aac', channels: 2, isAtmos: false }],
        subtitleStreams: [],
        addedAt: '2026-09-19T00:00:00.000Z',
        metadata: {
          hasPoster: false,
          hasBackdrop: false,
          hasLogo: false,
          seriesTitle: 'Severance',
        },
      }),
    );
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(`valence://open/show/${mockEpisode.id}`);

    const drawn = await drawSignedIn(cache);

    expect(await drawn.findByText(`Show severance in ${LIBRARY}`)).toBeTruthy();
  });

  it('opens what is playing from its chip', async () => {
    const drawn = await drawSignedIn();

    await userEvent.press(drawn.getByRole('button', { name: 'Open what is playing' }));

    expect(drawn.getByText('Now playing')).toBeTruthy();
  });

  it('stops the music as somebody leaves', async () => {
    const drawn = await drawSignedIn();

    await drawn.unmount();

    expect(mockMusic.leave).toHaveBeenCalled();
  });
});
