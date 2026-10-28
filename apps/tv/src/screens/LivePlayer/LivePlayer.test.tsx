import { act, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { liveQueries } from '@ValenceClient/query/liveQueries';
import { rememberServerAddress } from '@ValenceClient/session/serverAddress';
import { aLiveChannel } from '@ValenceClient/testing/aLiveChannel';
import { aLiveProgramme } from '@ValenceClient/testing/aLiveProgramme';
import { keepTheSessionToken } from '@ValenceTv/platform/theSessionToken';
import { aFakeVideoPlayer as mockAFakeVideoPlayer } from '@ValenceTv/testing/aFakeVideoPlayer';
import { LivePlayer } from '@ValenceTv/screens/LivePlayer/LivePlayer';
import type { LiveStream } from '@ValenceContracts/schemas/LiveTv';
import type { Sent } from '@ValenceClient/requests/sendToRequests';

type Heard = (event: { eventType: string; eventKeyAction?: number }) => void;

const mockRemote = new Set<Heard>();

const mockVideo = { current: mockAFakeVideoPlayer() };

const mockMenu: { back: (() => void) | null } = { back: null };

const mockWatch = jest.fn<Promise<Sent<LiveStream | null>>, [string]>();

jest.mock('react-native/Libraries/Components/TV/TVEventHandler', () => ({
  __esModule: true,
  default: {
    addListener: (heard: Heard) => {
      mockRemote.add(heard);

      return {
        remove: () => {
          mockRemote.delete(heard);
        },
      };
    },
  },
}));

jest.mock('expo-video', () => ({
  useVideoPlayer: () => mockVideo.current,
  VideoView: () => null,
}));

jest.mock('@ValenceTv/navigation/useMenuButton', () => ({
  useMenuButton: (back: (() => void) | null) => {
    mockMenu.back = back;
  },
}));

jest.mock('@ValenceClient/live/watchLiveChannel', () => ({
  watchLiveChannel: (id: string) => mockWatch(id),
}));

const press = (eventType: string) =>
  act(() => {
    for (const heard of mockRemote) {
      heard({ eventType, eventKeyAction: 1 });
    }
  });

const HOUR_MS = 60 * 60 * 1000;

const HALF_HOUR_MS = HOUR_MS / 2;

const NEWS = aLiveChannel({ id: '00000000-0000-4000-8000-00000000c001', name: 'News 24' });

const FILMS = aLiveChannel({
  id: '00000000-0000-4000-8000-00000000c002',
  name: 'Film Four',
  isFavourite: true,
});

const QUIET = aLiveChannel({ id: '00000000-0000-4000-8000-00000000c003', name: 'Quiet Hours' });

const aStream = (path: string): Sent<LiveStream | null> => ({
  value: { manifestUrl: path },
  refusal: { message: '' },
});

const drawPlayer = async (channelId: string, onLeave = jest.fn(), onShowing = jest.fn()) => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });
  const now = Date.now();
  const from = Math.floor(now / HALF_HOUR_MS) * HALF_HOUR_MS;

  cache.setQueryData(
    liveQueries.guide(new Date(from).toISOString(), new Date(from + 4 * HOUR_MS).toISOString())
      .queryKey,
    {
      hasProxy: false,
      channels: [NEWS, FILMS, QUIET],
      programmes: [
        aLiveProgramme(FILMS.id, 'Arrival', now - HALF_HOUR_MS, now + HALF_HOUR_MS),
        aLiveProgramme(FILMS.id, 'Dune', now + HALF_HOUR_MS, now + 3 * HOUR_MS),
      ],
    },
  );

  const drawn = await render(
    <QueryClientProvider client={cache}>
      <LivePlayer channelId={channelId} onLeave={onLeave} onShowing={onShowing} />
    </QueryClientProvider>,
  );

  return { ...drawn, onLeave, onShowing };
};

describe('LivePlayer', () => {
  beforeEach(() => {
    mockVideo.current = mockAFakeVideoPlayer();
    mockWatch.mockReset();
    mockWatch.mockImplementation((id) => Promise.resolve(aStream(`/api/live/relay/${id}`)));
    rememberServerAddress('https://valence.test');
    keepTheSessionToken('a-session');
  });

  afterEach(() => {
    mockRemote.clear();
  });

  it('plays the channel chosen, asked for as whoever is signed in', async () => {
    await drawPlayer(FILMS.id);

    await waitFor(() => {
      expect(mockVideo.current.replaceAsync).toHaveBeenCalledWith({
        uri: `https://valence.test/api/live/relay/${FILMS.id}`,
        headers: { authorization: 'Bearer a-session' },
        contentType: 'hls',
      });
    });
    expect(mockVideo.current.play).toHaveBeenCalled();
  });

  it('says what is on now and what is on next over the picture', async () => {
    const drawn = await drawPlayer(FILMS.id);

    expect(drawn.getByText('Film Four')).toBeOnTheScreen();
    expect(drawn.getByText('Arrival')).toBeOnTheScreen();
    expect(drawn.getByText(/^Next at .*: Dune$/)).toBeOnTheScreen();
  });

  it('changes channel with up and down, favourites first, starting the stream once it rests', async () => {
    const drawn = await drawPlayer(FILMS.id);

    await waitFor(() => {
      expect(mockWatch).toHaveBeenCalledWith(FILMS.id);
    });

    await press('down');

    expect(drawn.getByText('News 24')).toBeOnTheScreen();
    expect(mockWatch).not.toHaveBeenCalledWith(NEWS.id);

    await waitFor(() => {
      expect(mockWatch).toHaveBeenCalledWith(NEWS.id);
    });

    await press('up');
    await press('up');

    expect(drawn.getByText('Quiet Hours')).toBeOnTheScreen();
  });

  it('says a channel that is a web page plays on a computer or phone', async () => {
    mockWatch.mockResolvedValue({
      value: { embedUrl: 'https://example.com/live' },
      refusal: { message: '' },
    });

    const drawn = await drawPlayer(FILMS.id);

    expect(
      await drawn.findByText('This channel plays on a computer or phone, not on a TV.'),
    ).toBeOnTheScreen();
  });

  it('says why the server would not play a channel', async () => {
    mockWatch.mockResolvedValue({
      value: null,
      refusal: { message: 'The stream’s server didn’t answer.' },
    });

    const drawn = await drawPlayer(NEWS.id);

    expect(await drawn.findByText('The stream’s server didn’t answer.')).toBeOnTheScreen();
  });

  it('goes back to the guide with the channel last watched', async () => {
    const drawn = await drawPlayer(FILMS.id);

    await press('down');
    await act(() => {
      mockMenu.back?.();
    });

    expect(drawn.onLeave).toHaveBeenCalledWith(NEWS.id);
  });

  it('puts the details away first where the picture is playing', async () => {
    const drawn = await drawPlayer(FILMS.id);

    await act(() => {
      mockVideo.current.tell('statusChange', { status: 'readyToPlay' });
    });
    await act(() => {
      mockMenu.back?.();
    });

    expect(drawn.onLeave).not.toHaveBeenCalled();

    await act(() => {
      mockMenu.back?.();
    });

    expect(drawn.onLeave).toHaveBeenCalledWith(FILMS.id);
  });

  it('says which channel it is showing as the remote changes it', async () => {
    const drawn = await drawPlayer(FILMS.id);

    await press('down');

    expect(drawn.onShowing).toHaveBeenCalledWith(FILMS.id);
    expect(drawn.onShowing).toHaveBeenLastCalledWith(NEWS.id);
  });

  it('takes no news of the last channel’s stream as news of the next', async () => {
    const drawn = await drawPlayer(FILMS.id);

    await waitFor(() => {
      expect(mockVideo.current.replaceAsync).toHaveBeenCalledTimes(1);
    });

    mockVideo.current.replaceAsync.mockImplementation(() => new Promise(() => {}));
    await press('down');
    await waitFor(() => {
      expect(mockVideo.current.replaceAsync).toHaveBeenCalledTimes(2);
    });
    await act(() => {
      mockVideo.current.tell('statusChange', { status: 'readyToPlay' });
    });
    await act(() => {
      mockMenu.back?.();
    });

    expect(drawn.onLeave).toHaveBeenCalledWith(NEWS.id);
  });

  it('says the channel sent no pictures where it never starts', async () => {
    jest.useFakeTimers();

    try {
      mockVideo.current.replaceAsync.mockImplementation(() => new Promise(() => {}));

      const drawn = await drawPlayer(FILMS.id);

      await act(() => {
        jest.advanceTimersByTime(20_000);
      });

      expect(drawn.getByText(/sent no pictures/)).toBeOnTheScreen();
    } finally {
      jest.useRealTimers();
    }
  });
});
