import { render, userEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { RequestsPage } from '@ValenceTv/screens/RequestsPage/RequestsPage';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

jest.mock('@ValenceClient/session/auth', () => ({
  fetchSession: () => new Promise(() => undefined),
}));

const ME = { id: 'me', name: 'Marques', email: 'marques@example.com', emailVerified: true };

const aCacheHolding = (requests: MediaRequest[] | null): QueryClient => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });

  if (requests !== null) {
    cache.setQueryData(requestsQueries.mediaRequests().queryKey, requests);
  }

  cache.setQueryData(sessionQueries.who().queryKey, ME);

  return cache;
};

const drawRequests = (
  requests: MediaRequest[] | null,
  told: { onOpen?: (request: MediaRequest) => void; onLight?: (path: string | null) => void } = {},
) =>
  render(
    <QueryClientProvider client={aCacheHolding(requests)}>
      <RequestsPage onOpen={told.onOpen ?? jest.fn()} onLight={told.onLight ?? jest.fn()} />
    </QueryClientProvider>,
  );

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => undefined));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('RequestsPage', () => {
  it('shows no requests while they are still being read', async () => {
    const drawn = await drawRequests(null);

    expect(drawn.getByText('Requests')).toBeTruthy();
    expect(drawn.queryByText('Nothing has been asked for yet.')).toBeNull();
    expect(drawn.queryByRole('button')).toBeNull();
  });

  it('says so when nothing has been asked for', async () => {
    const drawn = await drawRequests([]);

    expect(drawn.getByText('Nothing has been asked for yet.')).toBeTruthy();
    expect(drawn.getByText('Find something in Search, and request it from its page.')).toBeTruthy();
  });

  it('lists films and series newest first, and lights the page with the newest', async () => {
    const onLight = jest.fn();
    const drawn = await drawRequests(
      [
        aMediaRequest({ id: 'a', title: 'Dune', createdAt: '2026-09-01T00:00:00.000Z' }),
        aMediaRequest({
          id: 'b',
          title: 'Arrival',
          posterUrl: '/posters/arrival.jpg',
          createdAt: '2026-09-10T00:00:00.000Z',
        }),
        aMediaRequest({ id: 'c', kind: 'album', title: 'Blue' }),
      ],
      { onLight },
    );

    const rows = drawn.getAllByRole('button');

    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveAccessibleName('Arrival, Requested');
    expect(rows[1]).toHaveAccessibleName('Dune, Requested');
    expect(drawn.queryByText(/Blue/)).toBeNull();
    expect(onLight).toHaveBeenCalledWith('/posters/arrival.jpg');
  });

  it('says whose a request is where somebody else asked for it', async () => {
    const drawn = await drawRequests([
      aMediaRequest({ id: 'a', requestedBy: { id: 'me', name: 'Marques' } }),
      aMediaRequest({ id: 'b', title: 'Arrival', requestedBy: { id: 'sam', name: 'Sam' } }),
    ]);

    expect(drawn.getByText('Requested   ·   Asked for by Sam')).toBeTruthy();
    expect(drawn.getByText('Requested')).toBeTruthy();
  });

  it('opens the request chosen', async () => {
    const onOpen = jest.fn();
    const dune = aMediaRequest();
    const drawn = await drawRequests([dune], { onOpen });

    await userEvent.press(drawn.getByRole('button', { name: 'Dune, Requested' }));

    expect(onOpen).toHaveBeenCalledWith(dune);
  });
});
