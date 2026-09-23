import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { aCatalogueTitle } from '@ValenceClient/testing/aCatalogueTitle';
import { Discovered } from './Discovered';
import type { ReactNode } from 'react';
import type { CatalogueDiscovery } from '@ValenceContracts/schemas/CatalogueTitle';

const around = (children: ReactNode) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

const answering = (body: CatalogueDiscovery) => {
  globalThis.fetch = jest.fn().mockResolvedValue(Response.json(body));
};

describe('Discovered', () => {
  it('draws a shelf of films', async () => {
    answering({
      shelves: [
        { id: 'trending', title: 'Trending films', titles: [aCatalogueTitle()], browse: null },
      ],
      studios: [],
    });

    const drawn = await render(around(<Discovered onAsk={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByText('Trending films')).toBeTruthy();
    });
    expect(drawn.getByRole('button', { name: 'Dune' })).toBeTruthy();
  });

  it('leaves out a shelf of music', async () => {
    answering({
      shelves: [
        { id: 'trending', title: 'Trending films', titles: [aCatalogueTitle()], browse: null },
        {
          id: 'albums',
          title: 'Popular albums',
          titles: [aCatalogueTitle({ kind: 'album', id: 'a-1', title: 'Blue' })],
          browse: null,
        },
      ],
      studios: [],
    });

    const drawn = await render(around(<Discovered onAsk={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByText('Trending films')).toBeTruthy();
    });
    expect(drawn.queryByText('Popular albums')).toBeNull();
  });

  it('says so where it could not be read', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(new Response(null, { status: 500 }));

    const drawn = await render(around(<Discovered onAsk={jest.fn()} />));

    expect(await drawn.findByText('That could not be read.')).toBeTruthy();
  });
});
