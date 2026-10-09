import { render, userEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { aCatalogueTitle } from '@ValenceClient/testing/aCatalogueTitle';
import { useDiscoverSearch } from '@ValenceClient/requests/useDiscoverSearch';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';
import { TheDiscoverResults } from './TheDiscoverResults';
import type { ReactNode } from 'react';

jest.mock('@ValenceClient/requests/useDiscoverSearch');

const around = (children: ReactNode) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

const finding = (films: CatalogueTitle[], shows: CatalogueTitle[], isPending = false) => {
  jest.mocked(useDiscoverSearch).mockReturnValue({
    films,
    shows,
    artists: [],
    books: [],
    count: films.length + shows.length,
    isPending,
  });
};

describe('TheDiscoverResults', () => {
  it('draws a shelf of films and one of programmes', async () => {
    finding(
      [aCatalogueTitle()],
      [aCatalogueTitle({ kind: 'series', id: 's-1', title: 'A Programme' })],
    );

    const drawn = await render(
      around(<TheDiscoverResults asked="dune" onAsk={jest.fn()} onBack={jest.fn()} />),
    );

    expect(drawn.getByText('Results for “dune”')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Dune' })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'A Programme' })).toBeTruthy();
  });

  it('says so where the catalogues have nothing', async () => {
    finding([], []);

    const drawn = await render(
      <TheDiscoverResults asked="dune" onAsk={jest.fn()} onBack={jest.fn()} />,
    );

    expect(drawn.getByText('Nothing in the catalogues matches “dune”.')).toBeTruthy();
  });

  it('goes back to what the library found', async () => {
    finding([], []);
    const onBack = jest.fn();

    const drawn = await render(
      <TheDiscoverResults asked="dune" onAsk={jest.fn()} onBack={onBack} />,
    );
    await userEvent.press(drawn.getByText('Back to library results'));

    expect(onBack).toHaveBeenCalled();
  });
});
