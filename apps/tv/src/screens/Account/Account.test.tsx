import { render, userEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { aboutQueries } from '@ValenceClient/query/aboutQueries';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { signOutHere } from '@ValenceTv/session/signOutHere';
import { Account } from '@ValenceTv/screens/Account/Account';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

jest.mock('@ValenceClient/session/auth', () => ({
  fetchSession: () => new Promise(() => undefined),
}));

jest.mock('@ValenceTv/session/signOutHere', () => ({
  signOutHere: jest.fn(() => Promise.resolve()),
}));

const USER = {
  id: 'me',
  name: 'Marques',
  email: 'marques@example.com',
  emailVerified: true,
};

const JO: ViewerProfile = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Jo',
  colour: '#3a8ee8',
  avatar: { kind: 'initial', font: 'gilroy' },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};

const aCache = ({ mayRequest }: { mayRequest: boolean }): QueryClient => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });

  cache.setQueryData(profileQueries.watching().queryKey, JO);
  cache.setQueryData(aboutQueries.server().queryKey, { commit: 'abc123' });
  cache.setQueryData(requestsQueries.availability().queryKey, { isEnabled: mayRequest });
  cache.setQueryData(sessionQueries.permissions().queryKey, {
    permissions: ['requests.ask'],
    isAdministrator: false,
  });
  cache.setQueryData(requestsQueries.mediaRequests().queryKey, []);
  cache.setQueryData(sessionQueries.who().queryKey, USER);

  return cache;
};

const drawAccount = (
  cache: QueryClient,
  told: { onChangeServer?: () => void; onRequests?: () => void } = {},
) =>
  render(
    <QueryClientProvider client={cache}>
      <Account
        user={USER}
        onChangeServer={told.onChangeServer ?? jest.fn()}
        onRequests={told.onRequests ?? jest.fn()}
        onOpenRequest={jest.fn()}
        upTo={null}
      />
    </QueryClientProvider>,
  );

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => undefined));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Account', () => {
  it('names who is watching, where, and which build this is', async () => {
    const drawn = await drawAccount(aCache({ mayRequest: false }));

    expect(drawn.getByText('Jo')).toBeTruthy();
    expect(drawn.getByText('Watching on this Valence')).toBeTruthy();
    expect(drawn.getByText(/Server abc123/)).toBeTruthy();
  });

  it('offers every request only to somebody who may ask for things', async () => {
    const may = await drawAccount(aCache({ mayRequest: true }));

    expect(may.getByRole('button', { name: 'All requests' })).toBeTruthy();

    const mayNot = await drawAccount(aCache({ mayRequest: false }));

    expect(mayNot.queryByRole('button', { name: 'All requests' })).toBeNull();
  });

  it('says when somebody wants every request or another server', async () => {
    const onRequests = jest.fn();
    const onChangeServer = jest.fn();
    const drawn = await drawAccount(aCache({ mayRequest: true }), { onRequests, onChangeServer });

    await userEvent.press(drawn.getByRole('button', { name: 'All requests' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Use a different server' }));

    expect(onRequests).toHaveBeenCalledTimes(1);
    expect(onChangeServer).toHaveBeenCalledTimes(1);
  });

  it('signs this television out and forgets what it knew', async () => {
    const cache = aCache({ mayRequest: false });
    const forgetting = jest.spyOn(cache, 'invalidateQueries');
    const drawn = await drawAccount(cache);

    await userEvent.press(drawn.getByRole('button', { name: 'Sign out, Choose another profile' }));

    expect(signOutHere).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(forgetting).toHaveBeenCalled();
    });
  });
});
