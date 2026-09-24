import { fireEvent, render as drawIt, userEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import type { ReactElement } from 'react';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';
import { CatalogueCard } from '@ValenceTv/components/CatalogueCard/CatalogueCard';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';

const DUNE: CatalogueTitle = {
  kind: 'film',
  id: '438631',
  title: 'Dune',
  subtitle: null,
  year: 2021,
  overview: null,
  posterUrl: 'https://image.tmdb.org/dune.jpg',
  standing: { status: 'askable', mediaId: null, requestId: null, requestState: null },
};

const REQUESTED: CatalogueTitle = {
  ...DUNE,
  standing: {
    status: 'requested',
    mediaId: null,
    requestId: '00000000-0000-4000-8000-000000000001',
    requestState: 'awaitingApproval',
  },
};

const HAD: CatalogueTitle = {
  ...DUNE,
  standing: { status: 'library', mediaId: 'media-1', requestId: null, requestState: null },
};

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

describe('CatalogueCard', () => {
  it('opens the title it shows', async () => {
    const onPress = jest.fn();
    const drawn = await render(<CatalogueCard title={DUNE} onPress={onPress} />);

    await userEvent.press(drawn.getByRole('button', { name: 'Dune' }));

    expect(onPress).toHaveBeenCalledWith(DUNE);
  });

  it('says where a title that has been asked for stands', async () => {
    const drawn = await render(<CatalogueCard title={REQUESTED} onPress={jest.fn()} />);

    expect(drawn.getByRole('button', { name: 'Dune, Waiting for approval' })).toBeTruthy();
    expect(drawn.getByText('Waiting for approval')).toBeTruthy();
  });

  it('says one the library already has is in it, in words, with no tick until it is watched', async () => {
    const drawn = await render(<CatalogueCard title={HAD} onPress={jest.fn()} />);

    expect(drawn.getByRole('button', { name: 'Dune, In your library' })).toBeTruthy();
    expect(drawn.getByText('In your library')).toBeTruthy();
    expect(drawn.queryByLabelText('Watched')).toBeNull();
  });

  it('ticks one this viewer has watched', async () => {
    const drawn = await render(<CatalogueCard title={HAD} onPress={jest.fn()} />, [
      {
        mediaId: 'media-1',
        positionSeconds: 60,
        durationSeconds: 60,
        isFinished: true,
        updatedAt: '2026-09-24T00:00:00.000Z',
      },
    ]);

    expect(drawn.getByRole('button', { name: 'Dune, In your library, watched' })).toBeTruthy();
    expect(drawn.getByLabelText('Watched')).toBeTruthy();
  });

  it('names the title beneath its poster only while the remote is on it', async () => {
    const drawn = await render(<CatalogueCard title={DUNE} onPress={jest.fn()} />);

    expect(drawn.getByText('Dune')).toHaveStyle({ opacity: 0 });

    await fireEvent(drawn.getByRole('button', { name: 'Dune' }), 'focus');

    expect(drawn.getByText('Dune')).not.toHaveStyle({ opacity: 0 });
  });
});
