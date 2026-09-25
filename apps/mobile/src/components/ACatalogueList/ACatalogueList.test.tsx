import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { aCatalogueTitle } from '@ValenceClient/testing/aCatalogueTitle';
import { ACatalogueList } from './ACatalogueList';
import type { ReactNode } from 'react';
import type { CataloguePage } from '@ValenceContracts/schemas/CatalogueTitle';

const around = (children: ReactNode) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

const answering = (body: CataloguePage) => {
  globalThis.fetch = jest.fn().mockResolvedValue(Response.json(body));
};

describe('ACatalogueList', () => {
  it('names the list and draws what is on its first page', async () => {
    answering({ titles: [aCatalogueTitle()], page: 1, hasMore: true });

    const drawn = await render(
      around(
        <ACatalogueList
          browsing={{ kind: 'film', list: 'trending', studio: null }}
          title="Trending films"
          onAsk={jest.fn()}
          onBack={jest.fn()}
        />,
      ),
    );

    expect(drawn.getByText('Trending films')).toBeTruthy();
    await waitFor(() => {
      expect(drawn.getByRole('button', { name: 'Dune' })).toBeTruthy();
    });
  });

  it('asks the catalogue for the list it was opened from', async () => {
    answering({ titles: [], page: 1, hasMore: false });

    await render(
      around(
        <ACatalogueList
          browsing={{ kind: 'series', list: 'popular', studio: null }}
          title="Popular series"
          onAsk={jest.fn()}
          onBack={jest.fn()}
        />,
      ),
    );

    await waitFor(() => {
      const asked = jest.mocked(globalThis.fetch).mock.calls[0]?.[0];

      expect(typeof asked === 'string' ? asked : '').toContain('popular');
    });
  });
});
