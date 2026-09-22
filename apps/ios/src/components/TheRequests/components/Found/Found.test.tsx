import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { aCatalogueTitle } from '@ValenceClient/testing/aCatalogueTitle';
import { Found } from './Found';
import type { ReactNode } from 'react';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';
import { theAddressOf } from '@ValencePhone/testing/theAddressOf';

const around = (children: ReactNode) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

/**
 * Answers a search for films with one list and for programmes with another.
 */
const answering = (films: CatalogueTitle[], programmes: CatalogueTitle[]) => {
  globalThis.fetch = jest.fn((input: RequestInfo | URL) =>
    Promise.resolve(
      Response.json(theAddressOf(input).includes('kind=series') ? programmes : films),
    ),
  );
};

describe('Found', () => {
  it('finds films and programmes both', async () => {
    answering(
      [aCatalogueTitle()],
      [aCatalogueTitle({ kind: 'series', id: '1399', title: 'Game of Thrones' })],
    );

    const drawn = await render(around(<Found asked="dune" onAsk={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByRole('button', { name: 'Dune' })).toBeTruthy();
    });
    expect(drawn.getByRole('button', { name: 'Game of Thrones' })).toBeTruthy();
  });

  it('says so where there is nothing', async () => {
    answering([], []);

    const drawn = await render(around(<Found asked="zzzz" onAsk={jest.fn()} />));

    expect(await drawn.findByText('Nothing called that.')).toBeTruthy();
  });
});
