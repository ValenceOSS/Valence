import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { Asked } from './Asked';
import type { ReactNode } from 'react';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import { theAddressOf } from '@ValencePhone/testing/theAddressOf';

const around = (children: ReactNode) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

/**
 * Answers the list of requests with these, and everything else with nobody.
 */
const answering = (requests: MediaRequest[]) => {
  globalThis.fetch = jest.fn((input: RequestInfo | URL) =>
    Promise.resolve(
      theAddressOf(input).endsWith('/api/requests/media')
        ? Response.json(requests)
        : new Response(null, { status: 401 }),
    ),
  );
};

describe('Asked', () => {
  it('lists the films asked for', async () => {
    answering([aMediaRequest()]);

    const drawn = await render(around(<Asked onAsk={jest.fn()} />));

    expect(await drawn.findByText('Dune (2021)')).toBeTruthy();
  });

  it('leaves out music', async () => {
    answering([aMediaRequest({ kind: 'album', title: 'Blue', tmdbId: null })]);

    const drawn = await render(around(<Asked onAsk={jest.fn()} />));

    expect(await drawn.findByText('Nothing asked for yet.')).toBeTruthy();
  });

  it('says so where nothing has been asked for', async () => {
    answering([]);

    const drawn = await render(around(<Asked onAsk={jest.fn()} />));

    expect(await drawn.findByText('Nothing asked for yet.')).toBeTruthy();
  });
});
