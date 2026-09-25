import { render as drawIt, userEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import type { ReactElement } from 'react';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';
import { aCatalogueTitle } from '@ValenceClient/testing/aCatalogueTitle';
import { ACatalogueCard } from './ACatalogueCard';

/**
 * Draws with a cache holding what this viewer has watched.
 *
 * @param element - What to draw.
 * @param progress - What has been watched.
 * @returns What was drawn.
 */
const render = (element: ReactElement, progress: WatchProgress[] = []) => {
  const cache = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });

  cache.setQueryData(viewingQueries.progress().queryKey, progress);

  return drawIt(<QueryClientProvider client={cache}>{element}</QueryClientProvider>);
};

describe('ACatalogueCard', () => {
  it('opens the title it shows', async () => {
    const onAsk = jest.fn();
    const drawn = await render(<ACatalogueCard title={aCatalogueTitle()} onAsk={onAsk} />);

    await userEvent.press(drawn.getByRole('button', { name: 'Dune' }));

    expect(onAsk).toHaveBeenCalledWith('film', '438631');
  });

  it('says when it is here already', async () => {
    const drawn = await render(
      <ACatalogueCard
        title={aCatalogueTitle({
          standing: { status: 'library', mediaId: 'm-1', requestId: null, requestState: null },
        })}
        onAsk={jest.fn()}
      />,
    );

    expect(drawn.getByText('In your library')).toBeTruthy();
  });

  it('ticks a film in the library once it has been watched, and not before', async () => {
    const held = aCatalogueTitle({
      standing: { status: 'library', mediaId: 'm-1', requestId: null, requestState: null },
    });
    const unseen = await render(<ACatalogueCard title={held} onAsk={jest.fn()} />);

    expect(unseen.queryByLabelText('Watched')).toBeNull();

    const seen = await render(<ACatalogueCard title={held} onAsk={jest.fn()} />, [
      {
        mediaId: 'm-1',
        positionSeconds: 60,
        durationSeconds: 60,
        isFinished: true,
        updatedAt: '2026-09-24T00:00:00.000Z',
      },
    ]);

    expect(seen.getByLabelText('Watched')).toBeTruthy();
  });

  it('says nothing where it can still be asked for', async () => {
    const drawn = await render(<ACatalogueCard title={aCatalogueTitle()} onAsk={jest.fn()} />);

    expect(drawn.queryByText('Requested')).toBeNull();
    expect(drawn.queryByText('In your library')).toBeNull();
  });

  it('draws nothing for music', async () => {
    const drawn = await render(
      <ACatalogueCard title={aCatalogueTitle({ kind: 'album' })} onAsk={jest.fn()} />,
    );

    expect(drawn.queryByRole('button')).toBeNull();
  });
});
