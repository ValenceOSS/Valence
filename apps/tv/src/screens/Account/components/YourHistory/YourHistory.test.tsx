import { render, userEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { YourHistory } from '@ValenceTv/screens/Account/components/YourHistory/YourHistory';
import type { Viewing } from '@ValenceContracts/schemas/Viewing';

const aViewing = (
  id: string,
  title: string,
  seriesTitle: string | null,
  isFinished = false,
): Viewing => ({
  id,
  mediaItemId: `media-${id}`,
  title,
  seriesTitle,
  startedAt: new Date().toISOString(),
  lastWatchedAt: new Date().toISOString(),
  secondsWatched: 600,
  isFinished,
});

const drawWith = (viewings: Viewing[], onOpen = jest.fn()) => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });

  cache.setQueryData(viewingQueries.history().queryKey, { pages: [viewings], pageParams: [0] });

  return render(
    <QueryClientProvider client={cache}>
      <YourHistory onOpen={onOpen} onFocus={jest.fn()} />
    </QueryClientProvider>,
  );
};

describe('YourHistory', () => {
  it('draws nothing where nothing has been watched', async () => {
    const drawn = await drawWith([]);

    expect(drawn.queryByText('Watch history')).toBeNull();
  });

  it('names a film, and an episode by its programme, opening each', async () => {
    const onOpen = jest.fn();
    const drawn = await drawWith(
      [aViewing('1', 'Arrival', null, true), aViewing('2', 'Half Loop', 'Severance')],
      onOpen,
    );

    expect(drawn.getByText('Watch history')).toBeTruthy();

    await userEvent.press(drawn.getByText('Arrival'));

    expect(onOpen).toHaveBeenLastCalledWith({ kind: 'film', mediaId: 'media-1' });

    await userEvent.press(drawn.getByText('Severance — Half Loop'));

    expect(onOpen).toHaveBeenLastCalledWith({ kind: 'show', mediaId: 'media-2' });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(YourHistory.displayName).toBe('YourHistory');
  });
});
