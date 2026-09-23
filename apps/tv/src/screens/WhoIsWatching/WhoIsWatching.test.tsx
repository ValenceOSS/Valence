import { render, userEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { rememberServerAddress } from '@ValenceClient/session/serverAddress';
import { WhoIsWatching } from '@ValenceTv/screens/WhoIsWatching/WhoIsWatching';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

jest.mock('@ValenceClient/session/auth', () => ({
  fetchSession: () => new Promise(() => undefined),
}));

jest.mock('@ValenceTv/layout/whereOnScreen', () => ({
  whereOnScreen: () => Promise.resolve({ x: 10, y: 20, width: 200, height: 200 }),
}));

const aProfile = (id: string, name: string): ViewerProfile => ({
  id,
  name,
  colour: '#3a8ee8',
  avatar: { kind: 'initial' },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
});

const JO = aProfile('00000000-0000-4000-8000-000000000001', 'Jo');

const SAM = aProfile('00000000-0000-4000-8000-000000000002', 'Sam');

const aCacheHolding = (profiles: ViewerProfile[] | null): QueryClient => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });

  if (profiles !== null) {
    cache.setQueryData(sessionQueries.wayIn().queryKey, { profiles, splashscreen: null });
  }

  return cache;
};

type Told = {
  onChoose?: (profile: ViewerProfile, from: object) => void;
  onUsePhone?: () => void;
  onChangeServer?: () => void;
};

const drawWhoIsWatching = (cache: QueryClient, told: Told = {}) =>
  render(
    <QueryClientProvider client={cache}>
      <WhoIsWatching
        onChoose={told.onChoose ?? jest.fn()}
        onUsePhone={told.onUsePhone ?? jest.fn()}
        onChangeServer={told.onChangeServer ?? jest.fn()}
      />
    </QueryClientProvider>,
  );

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => undefined));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('WhoIsWatching', () => {
  it('asks who is watching and shows the household’s faces', async () => {
    const drawn = await drawWhoIsWatching(aCacheHolding([JO, SAM]));

    expect(drawn.getByText('Who is watching?')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Jo' })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Sam' })).toBeTruthy();
  });

  it('shows no faces while they are still being read', async () => {
    const drawn = await drawWhoIsWatching(aCacheHolding(null));

    expect(drawn.queryByRole('button', { name: 'Jo' })).toBeNull();
    expect(drawn.queryByText('This Valence could not be reached.')).toBeNull();
  });

  it('says so when the server cannot be reached', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('offline'));

    const drawn = await drawWhoIsWatching(aCacheHolding(null));

    expect(await drawn.findByText('This Valence could not be reached.')).toBeTruthy();
  });

  it('tells which face was picked, and where it and the mark were', async () => {
    const onChoose = jest.fn();
    const drawn = await drawWhoIsWatching(aCacheHolding([JO, SAM]), { onChoose });

    await userEvent.press(drawn.getByRole('button', { name: 'Sam' }));

    await waitFor(() => {
      expect(onChoose).toHaveBeenCalledWith(SAM, {
        face: { x: 10, y: 20, width: 200, height: 200 },
        mark: { x: 10, y: 20, width: 200, height: 200 },
      });
    });
  });

  it('offers signing in with a phone or using another server', async () => {
    const onUsePhone = jest.fn();
    const onChangeServer = jest.fn();
    const drawn = await drawWhoIsWatching(aCacheHolding([JO]), { onUsePhone, onChangeServer });

    await userEvent.press(drawn.getByRole('button', { name: 'Sign in with your phone' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Use a different server' }));

    expect(onUsePhone).toHaveBeenCalledTimes(1);
    expect(onChangeServer).toHaveBeenCalledTimes(1);
  });

  it('names the server at the foot of the screen', async () => {
    rememberServerAddress('http://192.168.1.10:8420');

    const drawn = await drawWhoIsWatching(aCacheHolding([JO]));

    expect(drawn.getByText('© Valence · 192.168.1.10:8420')).toBeTruthy();
  });
});
