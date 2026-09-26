import { render, userEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { rememberServerAddress } from '@ValenceClient/session/serverAddress';
import { WhoIsWatching } from '@ValenceTv/screens/WhoIsWatching/WhoIsWatching';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

jest.mock('@ValenceClient/session/auth', () => ({
  fetchSession: () => new Promise(() => undefined),
  startDeviceGrant: () =>
    Promise.resolve({
      deviceCode: 'device-code',
      userCode: 'WDJB-MJHT',
      verificationUri: 'http://localhost:8420/device',
      verificationUriComplete: 'http://localhost:8420/device?user_code=WDJB-MJHT',
      intervalSeconds: 5,
      expiresInSeconds: 600,
    }),
  askWhetherTheDeviceMayIn: () => new Promise(() => undefined),
}));

jest.mock('@ValenceTv/layout/whereOnScreen', () => ({
  whereOnScreen: () => Promise.resolve({ x: 10, y: 20, width: 200, height: 200 }),
}));

const aProfile = (id: string, name: string): ViewerProfile => ({
  id,
  name,
  colour: '#3a8ee8',
  avatar: { kind: 'initial', font: 'gilroy' },
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
  onSignedIn?: () => void;
  onChangeServer?: () => void;
};

const drawWhoIsWatching = (cache: QueryClient, told: Told = {}) =>
  render(
    <QueryClientProvider client={cache}>
      <WhoIsWatching
        onChoose={told.onChoose ?? jest.fn()}
        onSignedIn={told.onSignedIn ?? jest.fn()}
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

  it('offers another server, and no phone while there are faces to pick', async () => {
    const onChangeServer = jest.fn();
    const drawn = await drawWhoIsWatching(aCacheHolding([JO]), { onChangeServer });

    await userEvent.press(drawn.getByRole('button', { name: 'Use a different server' }));

    expect(onChangeServer).toHaveBeenCalledTimes(1);
    expect(drawn.queryByText('Sign in with your phone')).toBeNull();
    expect(drawn.queryByText('WDJB-MJHT')).toBeNull();
  });

  it('asks for a phone straight away where the household is kept hidden', async () => {
    const drawn = await drawWhoIsWatching(aCacheHolding([]));

    expect(drawn.getByText('Sign in with your phone')).toBeTruthy();
    expect(drawn.queryByText('Who is watching?')).toBeNull();
    expect(await drawn.findByText('WDJB-MJHT')).toBeTruthy();
  });

  it('names the server at the foot of the screen', async () => {
    rememberServerAddress('http://192.168.1.10:8420');

    const drawn = await drawWhoIsWatching(aCacheHolding([JO]));

    expect(drawn.getByText('© Valence · 192.168.1.10:8420')).toBeTruthy();
  });
});
