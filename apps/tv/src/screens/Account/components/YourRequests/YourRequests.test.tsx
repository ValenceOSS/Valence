import { render, userEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { YourRequests } from '@ValenceTv/screens/Account/components/YourRequests/YourRequests';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

jest.mock('@ValenceClient/session/auth', () => ({
  fetchSession: () => new Promise(() => undefined),
}));

const ME = {
  id: 'me',
  name: 'Marques',
  email: 'marques@example.com',
  emailVerified: true,
};

const aCacheHolding = (requests: MediaRequest[]): QueryClient => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });

  cache.setQueryData(requestsQueries.mediaRequests().queryKey, requests);
  cache.setQueryData(sessionQueries.who().queryKey, ME);

  return cache;
};

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => undefined));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('YourRequests', () => {
  it('shows only the films and series this viewer asked for', async () => {
    const drawn = await render(
      <QueryClientProvider
        client={aCacheHolding([
          aMediaRequest({ id: 'a', title: 'Dune', requestedBy: { id: 'me', name: 'Marques' } }),
          aMediaRequest({ id: 'b', title: 'Arrival', requestedBy: { id: 'someone', name: 'Sam' } }),
          aMediaRequest({
            id: 'c',
            kind: 'album',
            title: 'Blue',
            requestedBy: { id: 'me', name: 'Marques' },
          }),
        ])}
      >
        <YourRequests onOpen={jest.fn()} onFocus={jest.fn()} />
      </QueryClientProvider>,
    );

    expect(drawn.getByText('Your requests')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Dune, Requested' })).toBeTruthy();
    expect(drawn.queryByText('Arrival')).toBeNull();
    expect(drawn.queryByText('Blue')).toBeNull();
  });

  it('draws nothing where this viewer has asked for nothing', async () => {
    const drawn = await render(
      <QueryClientProvider client={aCacheHolding([aMediaRequest()])}>
        <YourRequests onOpen={jest.fn()} onFocus={jest.fn()} />
      </QueryClientProvider>,
    );

    expect(drawn.queryByText('Your requests')).toBeNull();
  });

  it('hands over the request that was chosen', async () => {
    const onOpen = jest.fn();
    const mine = aMediaRequest({ requestedBy: { id: 'me', name: 'Marques' } });
    const drawn = await render(
      <QueryClientProvider client={aCacheHolding([mine])}>
        <YourRequests onOpen={onOpen} onFocus={jest.fn()} />
      </QueryClientProvider>,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Dune, Requested' }));

    expect(onOpen).toHaveBeenCalledWith(mine);
  });
});
