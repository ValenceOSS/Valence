import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { liveQueries } from '@ValenceClient/query/liveQueries';
import { aLiveChannel } from '@ValenceClient/testing/aLiveChannel';
import { aLiveProgramme } from '@ValenceClient/testing/aLiveProgramme';
import { LiveGuide } from '@ValenceTv/screens/LiveGuide/LiveGuide';
import type { LiveGuide as LiveGuideData } from '@ValenceContracts/schemas/LiveTv';

const mockFocused = jest.fn<void, [string | undefined]>();

jest.mock('@ValenceTv/navigation/giveFocusTo', () => ({
  giveFocusTo: (view: { props?: { accessibilityLabel?: string } } | null | undefined) => {
    mockFocused(view?.props?.accessibilityLabel);
  },
}));

type Heard = (event: { eventType: string; eventKeyAction?: number }) => void;

const mockRemote = new Set<Heard>();

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

const press = (eventType: string) =>
  act(() => {
    for (const heard of mockRemote) {
      heard({ eventType, eventKeyAction: 1 });
    }
  });

const HOUR_MS = 60 * 60 * 1000;

const HALF_HOUR_MS = HOUR_MS / 2;

const halfHourNow = () => Math.floor(Date.now() / HALF_HOUR_MS) * HALF_HOUR_MS;

const NEWS = aLiveChannel({ id: '00000000-0000-4000-8000-00000000c001', name: 'News 24' });

const FILMS = aLiveChannel({
  id: '00000000-0000-4000-8000-00000000c002',
  name: 'Film Four',
  number: '15',
  isFavourite: true,
});

const QUIET = aLiveChannel({ id: '00000000-0000-4000-8000-00000000c003', name: 'Quiet Hours' });

const guideFrom = (from: number): LiveGuideData => ({
  hasProxy: false,
  channels: [NEWS, FILMS, QUIET],
  programmes: [
    aLiveProgramme(NEWS.id, 'Headlines', from - HALF_HOUR_MS, from + HOUR_MS),
    aLiveProgramme(NEWS.id, 'Weather', from + HOUR_MS, from + 3 * HOUR_MS),
    aLiveProgramme(FILMS.id, 'Arrival', from, from + 2 * HOUR_MS),
    aLiveProgramme(FILMS.id, 'Dune', from + 2 * HOUR_MS, from + 5 * HOUR_MS),
  ],
});

const keyFor = (from: number) =>
  liveQueries.guide(new Date(from).toISOString(), new Date(from + 2 * HOUR_MS).toISOString())
    .queryKey;

const drawGuide = async (
  guide: LiveGuideData | null = null,
  onWatch = jest.fn(),
  isCovered = false,
  cameBackTo: { channelId: string } | null = null,
) => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });
  const from = halfHourNow();

  for (const steps of [0, 1, 2]) {
    cache.setQueryData(keyFor(from + steps * HOUR_MS), guide ?? guideFrom(from));
  }

  const drawn = await render(
    <QueryClientProvider client={cache}>
      <LiveGuide onWatch={onWatch} upTo={null} cameBackTo={cameBackTo} isCovered={isCovered} />
    </QueryClientProvider>,
  );

  return { ...drawn, from, onWatch, cache };
};

const restAMoment = () =>
  act(async () => {
    await new Promise((settled) => {
      setTimeout(settled, 200);
    });
  });

describe('LiveGuide', () => {
  beforeEach(() => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockRemote.clear();
  });

  it('puts the favourite channels first, numbered where they have a number', async () => {
    const drawn = await drawGuide();
    const cells = drawn.getAllByRole('button');

    expect(cells[0]?.props.accessibilityLabel).toMatch(/^Film Four, /);
    expect(drawn.getByText('15')).toBeOnTheScreen();
  });

  it('watches a programme’s channel when it is chosen', async () => {
    const drawn = await drawGuide();

    await fireEvent.press(drawn.getByLabelText(/: Arrival$/));

    expect(drawn.onWatch).toHaveBeenCalledWith(FILMS.id);
  });

  it('says a channel is live with no guide where the guide has nothing for it', async () => {
    const drawn = await drawGuide();

    expect(drawn.getByText('Live now · no guide')).toBeOnTheScreen();
  });

  it('adds a channel to favourites when a programme on it is held', async () => {
    const drawn = await drawGuide();

    await fireEvent(drawn.getByLabelText(/: Headlines$/), 'longPress');

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `/api/live/channels/${NEWS.id}/favourite`,
        expect.objectContaining({ method: 'PUT' }),
      );
    });
    await waitFor(() => {
      expect(drawn.getAllByRole('button')[0]?.props.accessibilityLabel).toMatch(/^News 24, /);
    });
  });

  it('moves the guide on an hour when the remote presses on past the last programme', async () => {
    const drawn = await drawGuide();

    expect(drawn.queryByLabelText(/: Dune$/)).not.toBeOnTheScreen();

    await fireEvent(drawn.getByLabelText(/: Weather$/), 'focus');
    await restAMoment();
    await press('right');

    await waitFor(() => {
      expect(drawn.getByLabelText(/: Dune$/)).toBeOnTheScreen();
    });
    expect(drawn.queryByLabelText(/: Headlines$/)).not.toBeOnTheScreen();
  });

  it('leaves the remote alone while something is drawn over the guide', async () => {
    const drawn = await drawGuide(null, jest.fn(), true);

    await fireEvent(drawn.getByLabelText(/: Weather$/), 'focus');
    await restAMoment();
    await press('right');

    expect(drawn.queryByLabelText(/: Dune$/)).not.toBeOnTheScreen();
  });

  it('sends the remote to the channel last watched when the player closes', async () => {
    mockFocused.mockClear();
    await drawGuide(null, jest.fn(), false, { channelId: QUIET.id });

    await waitFor(() => {
      expect(mockFocused).toHaveBeenCalledWith(expect.stringMatching(/^Quiet Hours, /));
    });
  });

  it('never moves the guide back before the half hour now', async () => {
    const drawn = await drawGuide();

    await fireEvent(drawn.getByLabelText(/: Headlines$/), 'focus');
    await restAMoment();
    await press('left');

    expect(drawn.getByLabelText(/: Headlines$/)).toBeOnTheScreen();
    expect(drawn.cache.getQueryState(keyFor(drawn.from - HOUR_MS))).toBeUndefined();
  });

  it('says so where the server has no channels', async () => {
    const drawn = await drawGuide({ hasProxy: false, channels: [], programmes: [] });

    expect(drawn.getByText('No live TV channels yet')).toBeOnTheScreen();
  });
});
