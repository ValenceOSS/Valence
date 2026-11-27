import { act, fireEvent, render, userEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { aViewing } from '@ValenceClient/testing/aViewing';
import { WatchHistory } from './WatchHistory';
import type { WatchedTitle } from '@ValenceClient/history/groupHistory';
import type { Viewing } from '@ValenceContracts/schemas/Viewing';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';
import type { WatchHistoryProps } from './WatchHistory.types';

const mockForget = jest.fn<Promise<boolean>, [QueryClient, WatchedTitle, boolean]>();

const mockForgetEverything = jest.fn<Promise<number>, []>();

jest.mock('@ValenceClient/history/forgetTitleInPlace', () => ({
  forgetTitleInPlace: (cache: QueryClient, watched: WatchedTitle, canForgetTitle: boolean) =>
    mockForget(cache, watched, canForgetTitle),
}));

jest.mock('@ValenceClient/about/useServerHas', () => ({
  useServerHas: (feature: string) => feature === 'history.forgetTitle',
}));

jest.mock('@ValenceClient/history/fetchHistory', () => ({
  fetchHistory: () => new Promise(() => undefined),
  forgetViewing: jest.fn(),
  forgetHistory: () => mockForgetEverything(),
  A_PAGE: 30,
}));

jest.mock('@ValenceTv/navigation/useMenuToClose', () => ({ useMenuToClose: jest.fn() }));

jest.mock('@ValenceClient/library/findTheEpisodeAfter', () => ({
  findTheEpisodeAfter: () => Promise.resolve(null),
}));

const SEVERANCE = 'series-severance';

const episode = (id: string, title: string, at: string): Viewing =>
  aViewing({
    id,
    mediaItemId: `00000000-0000-4000-8000-0000000000${id}`,
    title,
    seriesTitle: 'Severance',
    seriesId: SEVERANCE,
    lastWatchedAt: at,
    isFinished: false,
  });

const LAID_OUT = { nativeEvent: { layout: { x: 0, y: 0, width: 1920, height: 1080 } } };

const HIDE_AND_SEEK = episode('e2', 'Hide and Seek', '2026-09-03T21:00:00.000Z');

const HALF_LOOP = episode('e1', 'Half Loop', '2026-09-02T21:00:00.000Z');

const ARRIVAL = aViewing({ id: 'f1', lastWatchedAt: '2026-09-01T21:00:00.000Z' });

const drawWith = async (
  pages: Viewing[][] | null,
  change: Partial<WatchHistoryProps> = {},
  progress: WatchProgress[] = [],
) => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });

  if (pages !== null) {
    cache.setQueryData(viewingQueries.history().queryKey, {
      pages,
      pageParams: pages.map((_, at) => at * 30),
    });
  }

  cache.setQueryData(viewingQueries.progress().queryKey, progress);

  const props: WatchHistoryProps = {
    onOpen: jest.fn(),
    onPlay: jest.fn(),
    onMood: jest.fn(),
    upTo: null,
    ...change,
  };
  const drawn = await render(
    <QueryClientProvider client={cache}>
      <WatchHistory {...props} />
    </QueryClientProvider>,
  );

  if (drawn.root !== null) {
    await fireEvent(drawn.root, 'layout', LAID_OUT);
  }

  return { drawn, props, cache };
};

beforeEach(() => {
  mockForget.mockReset();
  mockForget.mockResolvedValue(true);
  mockForgetEverything.mockReset();
  mockForgetEverything.mockResolvedValue(3);
});

describe('WatchHistory', () => {
  it('says what it is for where nothing has been watched', async () => {
    const { drawn } = await drawWith([[]]);

    expect(drawn.getByText(/^What you watch shows up here/u)).toBeTruthy();
    expect(drawn.queryByRole('button', { name: 'Clear all history' })).toBeNull();
  });

  it('stands a programme once, at the episode watched last, beside the films', async () => {
    const { drawn } = await drawWith([[HIDE_AND_SEEK, HALF_LOOP, ARRIVAL]]);

    expect(drawn.getByText('Watch history')).toBeTruthy();
    expect(drawn.getAllByText('Severance')).toHaveLength(1);
    expect(drawn.getByText(/^Hide and Seek · /u)).toBeTruthy();
    expect(drawn.queryByText(/^Half Loop · /u)).toBeNull();
    expect(drawn.getByText('Arrival')).toBeTruthy();
  });

  it('lights the page with what was watched last, then with the title the remote rests on', async () => {
    const { drawn, props } = await drawWith([[HIDE_AND_SEEK, ARRIVAL]]);

    expect(props.onMood).toHaveBeenLastCalledWith(
      `/api/media/${HIDE_AND_SEEK.mediaItemId}/image/backdrop?of=title&size=medium`,
    );

    await fireEvent(drawn.getByLabelText(/^Arrival, /u), 'focus');

    expect(props.onMood).toHaveBeenLastCalledWith(
      `/api/media/${ARRIVAL.mediaItemId}/image/backdrop?of=title&size=medium`,
    );
  });

  it('says how far through a title somebody got where they stopped part way', async () => {
    const { drawn } = await drawWith([[HIDE_AND_SEEK, ARRIVAL]], {}, [
      {
        mediaId: HIDE_AND_SEEK.mediaItemId,
        positionSeconds: 1500,
        durationSeconds: 3000,
        isFinished: false,
        updatedAt: '2026-09-03T21:00:00.000Z',
      },
    ]);

    expect(drawn.getAllByRole('progressbar')).toHaveLength(1);
  });

  it('resumes what was chosen from where it was left', async () => {
    const { drawn, props } = await drawWith([[HIDE_AND_SEEK]], {}, [
      {
        mediaId: HIDE_AND_SEEK.mediaItemId,
        positionSeconds: 1500,
        durationSeconds: 3000,
        isFinished: false,
        updatedAt: '2026-09-03T21:00:00.000Z',
      },
    ]);

    await userEvent.press(drawn.getByText('Severance'));
    await userEvent.press(drawn.getByRole('button', { name: /^Resume from / }));

    expect(props.onPlay).toHaveBeenCalledWith(HIDE_AND_SEEK.mediaItemId, 1500);
    expect(drawn.queryByRole('button', { name: /^Resume from / })).toBeNull();
  });

  it('takes the whole programme off the history, asking a server that can to forget it all', async () => {
    const asked = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { drawn } = await drawWith([[HIDE_AND_SEEK, HALF_LOOP, ARRIVAL]]);

    await userEvent.press(drawn.getByText('Severance'));
    await act(async () => {
      await Promise.resolve();
    });
    await userEvent.press(drawn.getByRole('button', { name: 'Remove from history' }));

    asked.mock.calls[0]?.[2]?.find((button) => button.style === 'destructive')?.onPress?.();

    expect(mockForget).toHaveBeenCalledWith(
      expect.any(QueryClient),
      expect.objectContaining({ latest: HIDE_AND_SEEK, viewingIds: ['e2', 'e1'] }),
      true,
    );

    asked.mockRestore();
  });

  it('clears the whole history only once somebody says so', async () => {
    const asked = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { drawn, cache } = await drawWith([[ARRIVAL]]);

    await userEvent.press(drawn.getByRole('button', { name: 'Clear all history' }));

    expect(asked).toHaveBeenCalledWith(
      'Clear your watch history?',
      expect.any(String),
      expect.any(Array),
    );
    expect(mockForgetEverything).not.toHaveBeenCalled();

    await act(async () => {
      asked.mock.calls[0]?.[2]?.find((button) => button.style === 'destructive')?.onPress?.();
      await Promise.resolve();
    });

    expect(mockForgetEverything).toHaveBeenCalled();
    await waitFor(() => {
      expect(cache.getQueryState(viewingQueries.history().queryKey)?.isInvalidated).toBe(true);
    });

    asked.mockRestore();
  });

  it('says that history is deleted after a year once there is nothing older to read', async () => {
    const { drawn } = await drawWith([[ARRIVAL]]);

    expect(drawn.getByText('Watch history is deleted automatically after one year.')).toBeTruthy();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(WatchHistory.displayName).toBe('WatchHistory');
  });
});
