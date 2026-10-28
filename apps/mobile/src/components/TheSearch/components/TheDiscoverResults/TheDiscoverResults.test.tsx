import { render, userEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { aCatalogueTitle } from '@ValenceClient/testing/aCatalogueTitle';
import { useDiscoverSearch } from '@ValenceClient/requests/useDiscoverSearch';
import { useServerHas } from '@ValenceClient/about/useServerHas';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';
import { TheDiscoverResults } from './TheDiscoverResults';
import type { ReactNode } from 'react';

jest.mock('@ValenceClient/requests/useDiscoverSearch');
jest.mock('@ValenceClient/about/useServerHas');

const around = (children: ReactNode) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

const finding = (
  films: CatalogueTitle[],
  shows: CatalogueTitle[],
  isPending = false,
  problem: string | null = null,
) => {
  jest.mocked(useDiscoverSearch).mockReturnValue({
    films,
    shows,
    artists: [],
    books: [],
    count: films.length + shows.length,
    isPending,
    problem,
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

  it('says why the catalogues could not be searched, rather than that they have nothing', async () => {
    finding([], [], false, 'Couldn’t reach TMDB.');

    const drawn = await render(
      <TheDiscoverResults asked="dune" onAsk={jest.fn()} onBack={jest.fn()} />,
    );

    expect(drawn.getByText('Couldn’t reach TMDB.')).toBeTruthy();
    expect(drawn.queryByText('Nothing in the catalogues matches “dune”.')).toBeNull();
  });

  it('opens everything found of films or of shows, where the server reads past a shelf', async () => {
    jest.mocked(useServerHas).mockReturnValue(true);
    finding(
      [aCatalogueTitle()],
      [aCatalogueTitle({ kind: 'series', id: 's-1', title: 'A Programme' })],
    );
    const onSeeAll = jest.fn();

    const drawn = await render(
      around(
        <TheDiscoverResults
          asked="dune"
          onAsk={jest.fn()}
          onBack={jest.fn()}
          onSeeAll={onSeeAll}
        />,
      ),
    );
    await userEvent.press(drawn.getByRole('button', { name: 'See all films' }));
    await userEvent.press(drawn.getByRole('button', { name: 'See all shows' }));

    expect(jest.mocked(useServerHas)).toHaveBeenCalledWith('requests.searchPages');
    expect(onSeeAll).toHaveBeenNthCalledWith(
      1,
      { kind: 'film', query: 'dune' },
      'Films for “dune”',
    );
    expect(onSeeAll).toHaveBeenNthCalledWith(
      2,
      { kind: 'series', query: 'dune' },
      'Shows for “dune”',
    );
  });

  it('offers no more than the shelf where the server cannot read past it', async () => {
    jest.mocked(useServerHas).mockReturnValue(false);
    finding([aCatalogueTitle()], []);

    const drawn = await render(
      around(
        <TheDiscoverResults
          asked="dune"
          onAsk={jest.fn()}
          onBack={jest.fn()}
          onSeeAll={jest.fn()}
        />,
      ),
    );

    expect(drawn.queryByRole('button', { name: 'See all films' })).toBeNull();
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
