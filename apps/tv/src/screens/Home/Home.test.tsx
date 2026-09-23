import { createElement as mockCreateElement } from 'react';
import { Text as mockText } from 'react-native';
import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { useHomeRows } from '@ValenceClient/library/useHomeRows';
import { putOnTheTopShelf } from '@ValenceTv/platform/putOnTheTopShelf';
import { Home } from '@ValenceTv/screens/Home/Home';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

jest.mock('@ValenceClient/library/useHomeRows', () => ({ useHomeRows: jest.fn() }));

jest.mock('@ValenceTv/platform/putOnTheTopShelf', () => ({ putOnTheTopShelf: jest.fn() }));

jest.mock('@ValenceTv/components/Hero/Hero', () => ({
  Hero: ({ items }: { items: readonly MediaSummary[] }) =>
    mockCreateElement(mockText, null, `Featuring ${items.map((one) => one.title).join(', ')}`),
}));

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

const ARRIVAL = aMedia();

const DUNE = aMedia({ id: '00000000-0000-4000-8000-000000000002', title: 'Dune' });

const HALFWAY: WatchProgress = {
  mediaId: ARRIVAL.id,
  positionSeconds: 3600,
  durationSeconds: 6960,
  isFinished: false,
  updatedAt: '2026-09-19T00:00:00.000Z',
};

const LAID_OUT = { nativeEvent: { layout: { x: 0, y: 0, width: 1920, height: 1080 } } };

type Rows = ReturnType<typeof useHomeRows>;

const someRows = (overrides: Partial<Rows> = {}): Rows => ({
  rails: [
    { id: 'resume', title: 'Continue Watching', items: [ARRIVAL] },
    { id: 'recent', title: 'Recently Added', items: [DUNE] },
  ],
  isReading: false,
  hasMore: false,
  isReadingMore: false,
  showMore: jest.fn(),
  ...overrides,
});

const aCache = (): QueryClient => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });

  cache.setQueryData(libraryQueries.across([LIBRARY], { search: '', limit: 40 }).queryKey, [DUNE]);
  cache.setQueryData(viewingQueries.progress().queryKey, [HALFWAY]);

  return cache;
};

const drawHome = async (
  told: {
    onOpen?: (media: MediaSummary) => void;
    onPlay?: (media: MediaSummary, startSeconds: number) => void;
    isHeldBack?: boolean;
  } = {},
) => {
  const drawn = await render(
    <QueryClientProvider client={aCache()}>
      <Home
        viewerId="viewer"
        watchable={[LIBRARY]}
        onOpen={told.onOpen ?? jest.fn()}
        onPlay={told.onPlay ?? jest.fn()}
        isCovered={false}
        onFeature={jest.fn()}
        upTo={null}
        playRef={jest.fn()}
        isHeldBack={told.isHeldBack ?? false}
      />
    </QueryClientProvider>,
  );

  if (drawn.root !== null) {
    await fireEvent(drawn.root, 'layout', LAID_OUT);
  }

  return drawn;
};

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => undefined));
  jest.mocked(useHomeRows).mockReturnValue(someRows());
  jest.mocked(putOnTheTopShelf).mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Home', () => {
  it('draws nothing while somebody’s face is still flying in', async () => {
    const drawn = await drawHome({ isHeldBack: true });

    expect(drawn.queryByText('Continue Watching')).toBeNull();
    expect(drawn.queryByText(/Featuring/)).toBeNull();
  });

  it('waits for the first shelves before drawing any', async () => {
    jest.mocked(useHomeRows).mockReturnValue(someRows({ rails: [], isReading: true }));

    const drawn = await drawHome();

    expect(drawn.queryByText('There is nothing to watch here yet.')).toBeNull();
    expect(drawn.queryByText(/Featuring/)).toBeNull();
  });

  it('says so when there is nothing to watch', async () => {
    jest.mocked(useHomeRows).mockReturnValue(someRows({ rails: [] }));

    const drawn = await drawHome();

    expect(drawn.getByText('There is nothing to watch here yet.')).toBeTruthy();
  });

  it('features titles across the top above a shelf for each row', async () => {
    const drawn = await drawHome();

    expect(drawn.getByText('Featuring Dune')).toBeTruthy();
    expect(drawn.getByText('Continue Watching')).toBeTruthy();
    expect(drawn.getByText('Recently Added')).toBeTruthy();
  });

  it('carries on from where this viewer left off on the shelf of what they are part-way through', async () => {
    const onPlay = jest.fn();
    const onOpen = jest.fn();
    const drawn = await drawHome({ onPlay, onOpen });

    await userEvent.press(drawn.getByRole('button', { name: 'Arrival' }));

    expect(onPlay).toHaveBeenCalledWith(ARRIVAL, 3600);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('opens the page of a title on any other shelf', async () => {
    const onOpen = jest.fn();
    const drawn = await drawHome({ onOpen });

    await userEvent.press(drawn.getByRole('button', { name: 'Dune' }));

    expect(onOpen).toHaveBeenCalledWith(DUNE);
  });

  it('hands what has just arrived to the television’s top shelf', async () => {
    await drawHome();

    expect(putOnTheTopShelf).toHaveBeenCalledWith([DUNE]);
  });

  it('asks for more shelves once the end of the page is near', async () => {
    const showMore = jest.fn();

    jest.mocked(useHomeRows).mockReturnValue(someRows({ hasMore: true, showMore }));

    const drawn = await drawHome();

    await fireEvent(drawn.getByText('Continue Watching'), 'contentSizeChange', 1920, 1200);

    expect(showMore).toHaveBeenCalledTimes(1);
  });

  it('asks for no more shelves where there are none', async () => {
    const showMore = jest.fn();

    jest.mocked(useHomeRows).mockReturnValue(someRows({ hasMore: false, showMore }));

    const drawn = await drawHome();

    await fireEvent(drawn.getByText('Continue Watching'), 'contentSizeChange', 1920, 1200);

    expect(showMore).not.toHaveBeenCalled();
  });
});
