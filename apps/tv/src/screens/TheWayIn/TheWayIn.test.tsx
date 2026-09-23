import { createElement as mockCreateElement } from 'react';
import { Text as mockText, View as mockView } from 'react-native';
import { act, render, userEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fetchSession } from '@ValenceClient/session/auth';
import { rememberServerAddress, serverAddress } from '@ValenceClient/session/serverAddress';
import { Button as mockButton } from '@ValenceTv/components/Button/Button';
import { keepTheSessionToken } from '@ValenceTv/platform/theSessionToken';
import { holdTheSession } from '@ValenceTv/session/holdTheSession';
import { signOutHere } from '@ValenceTv/session/signOutHere';
import { TheWayIn } from '@ValenceTv/screens/TheWayIn/TheWayIn';
import type { Leaving } from '@ValenceTv/components/Flight/Flight.types';
import type { SessionUser } from '@ValenceContracts/schemas/Session';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

const mockStandIn = (name: string, presses: Record<string, () => void> = {}) =>
  mockCreateElement(
    mockView,
    null,
    mockCreateElement(mockText, null, name),
    ...Object.entries(presses).map(([label, onPress]) =>
      mockCreateElement(mockButton, { key: label, label, onPress }),
    ),
  );

const mockJo: ViewerProfile = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Jo',
  colour: '#3a8ee8',
  avatar: { kind: 'initial' },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};

const mockSpot = { x: 10, y: 20, width: 200, height: 200 };

jest.mock('@ValenceClient/session/auth', () => ({ fetchSession: jest.fn() }));

jest.mock('@ValenceTv/session/holdTheSession', () => ({
  holdTheSession: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@ValenceTv/session/signOutHere', () => ({
  signOutHere: jest.fn(() => Promise.resolve()),
}));

jest.mock('@ValenceTv/components/Splash/Splash', () => ({
  Splash: ({ isDone }: { isDone: boolean }) =>
    mockStandIn(isDone ? 'Splash finishing' : 'Splash showing'),
}));

jest.mock('@ValenceTv/components/Flight/Flight', () => ({
  Flight: ({ onLanded }: { onLanded: () => void }) => mockStandIn('In flight', { Land: onLanded }),
}));

jest.mock('@ValenceTv/screens/ChooseServer/ChooseServer', () => ({
  ChooseServer: ({
    onChosen,
    couldNotReach,
  }: {
    onChosen: (address: string) => void;
    couldNotReach?: string;
  }) =>
    mockStandIn(couldNotReach === undefined ? 'Which server' : `Could not reach ${couldNotReach}`, {
      'Choose a server': () => {
        onChosen('http://valence.local:8420');
      },
    }),
}));

jest.mock('@ValenceTv/screens/WhoIsWatching/WhoIsWatching', () => ({
  WhoIsWatching: ({
    onChoose,
    onUsePhone,
    onChangeServer,
  }: {
    onChoose: (profile: ViewerProfile, from: Leaving) => void;
    onUsePhone: () => void;
    onChangeServer: () => void;
  }) =>
    mockStandIn('Who is watching', {
      'Pick Jo': () => {
        onChoose(mockJo, { face: mockSpot, mark: mockSpot });
      },
      'Use a phone': onUsePhone,
      'Use another server': onChangeServer,
    }),
}));

jest.mock('@ValenceTv/screens/EnterPassword/EnterPassword', () => ({
  EnterPassword: ({
    profile,
    onSignedIn,
    onBack,
    onFaceAt,
    onMarkAt,
  }: {
    profile: ViewerProfile;
    onSignedIn: (from: Leaving) => void;
    onBack: () => void;
    onFaceAt: (at: typeof mockSpot) => void;
    onMarkAt: (at: typeof mockSpot) => void;
  }) =>
    mockStandIn(`Password for ${profile.name}`, {
      'Password right': () => {
        onSignedIn({ face: mockSpot, mark: mockSpot });
      },
      'Someone else': onBack,
      'Say where the face and mark are': () => {
        onFaceAt(mockSpot);
        onMarkAt(mockSpot);
      },
    }),
}));

jest.mock('@ValenceTv/screens/PhoneHandoff/PhoneHandoff', () => ({
  PhoneHandoff: ({ onSignedIn, onBack }: { onSignedIn: () => void; onBack: () => void }) =>
    mockStandIn('Phone', { 'Phone approved': onSignedIn, 'Pick a face': onBack }),
}));

jest.mock('@ValenceTv/screens/SignedIn/SignedIn', () => ({
  SignedIn: ({
    user,
    onChangeServer,
    isArriving,
  }: {
    user: SessionUser;
    onChangeServer: () => void;
    isArriving: boolean;
  }) =>
    mockStandIn(`Signed in as ${user.name}${isArriving ? ', arriving' : ''}`, {
      'Move server': onChangeServer,
    }),
}));

const MARQUES: SessionUser = {
  id: 'me',
  name: 'Marques',
  email: 'marques@example.com',
  emailVerified: true,
};

const drawTheWayIn = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false, gcTime: Infinity } },
        })
      }
    >
      <TheWayIn />
    </QueryClientProvider>,
  );

beforeEach(() => {
  jest.mocked(fetchSession).mockReset();
  jest.mocked(fetchSession).mockResolvedValue(null);
  jest.mocked(holdTheSession).mockClear();
  jest.mocked(signOutHere).mockClear();
});

describe('TheWayIn', () => {
  it('asks which server first, and who is watching once one answers', async () => {
    const drawn = await drawTheWayIn();

    expect(drawn.getByText('Which server')).toBeTruthy();
    expect(fetchSession).not.toHaveBeenCalled();

    await userEvent.press(drawn.getByRole('button', { name: 'Choose a server' }));

    expect(await drawn.findByText('Who is watching')).toBeTruthy();
    expect(serverAddress()).toBe('http://valence.local:8420');
  });

  it('keeps the splash up until it is known who is signed in', async () => {
    rememberServerAddress('http://valence.local:8420');
    jest.mocked(fetchSession).mockReturnValue(new Promise(() => undefined));

    const drawn = await drawTheWayIn();

    await act(
      () =>
        new Promise((resolve) => {
          setTimeout(resolve, 800);
        }),
    );

    expect(drawn.getByText('Splash showing')).toBeTruthy();
  });

  it('lets the splash go once it has lingered and the session is known', async () => {
    rememberServerAddress('http://valence.local:8420');

    const drawn = await drawTheWayIn();

    expect(drawn.getByText('Splash showing')).toBeTruthy();
    expect(await drawn.findByText('Splash finishing')).toBeTruthy();
  });

  it('asks the face picked for its password, and goes back to the faces', async () => {
    rememberServerAddress('http://valence.local:8420');

    const drawn = await drawTheWayIn();

    await userEvent.press(await drawn.findByRole('button', { name: 'Pick Jo' }));

    expect(drawn.getByText('Password for Jo')).toBeTruthy();
    expect(drawn.getAllByText('In flight')).toHaveLength(2);

    await userEvent.press(drawn.getByRole('button', { name: 'Someone else' }));

    expect(drawn.getByText('Who is watching')).toBeTruthy();
  });

  it('lets the face and mark land where the password screen says they are', async () => {
    rememberServerAddress('http://valence.local:8420');

    const drawn = await drawTheWayIn();

    await userEvent.press(await drawn.findByRole('button', { name: 'Pick Jo' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Say where the face and mark are' }));

    for (const landing of drawn.getAllByRole('button', { name: 'Land' })) {
      await userEvent.press(landing);
    }

    expect(drawn.queryByText('In flight')).toBeNull();
  });

  it('goes on to everything else once the password is right', async () => {
    rememberServerAddress('http://valence.local:8420');

    const drawn = await drawTheWayIn();

    await userEvent.press(await drawn.findByRole('button', { name: 'Pick Jo' }));
    jest.mocked(fetchSession).mockResolvedValue(MARQUES);
    await userEvent.press(drawn.getByRole('button', { name: 'Password right' }));

    expect(await drawn.findByText('Signed in as Marques, arriving')).toBeTruthy();
  });

  it('signs in with a phone instead', async () => {
    rememberServerAddress('http://valence.local:8420');

    const drawn = await drawTheWayIn();

    await userEvent.press(await drawn.findByRole('button', { name: 'Use a phone' }));

    expect(drawn.getByText('Phone')).toBeTruthy();

    jest.mocked(fetchSession).mockResolvedValue(MARQUES);
    await userEvent.press(drawn.getByRole('button', { name: 'Phone approved' }));

    expect(await drawn.findByText('Signed in as Marques')).toBeTruthy();
  });

  it('goes back to the faces from the phone', async () => {
    rememberServerAddress('http://valence.local:8420');

    const drawn = await drawTheWayIn();

    await userEvent.press(await drawn.findByRole('button', { name: 'Use a phone' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Pick a face' }));

    expect(drawn.getByText('Who is watching')).toBeTruthy();
  });

  it('asks for another server when the one it had stops answering', async () => {
    rememberServerAddress('http://valence.local:8420');
    jest.mocked(fetchSession).mockRejectedValue(new Error('offline'));

    const drawn = await drawTheWayIn();

    expect(await drawn.findByText('Could not reach http://valence.local:8420')).toBeTruthy();
  });

  it('keeps hold of the session of somebody already signed in whose token was lost', async () => {
    rememberServerAddress('http://valence.local:8420');
    jest.mocked(fetchSession).mockResolvedValue(MARQUES);

    const drawn = await drawTheWayIn();

    expect(await drawn.findByText('Signed in as Marques')).toBeTruthy();
    expect(holdTheSession).toHaveBeenCalledTimes(1);
  });

  it('leaves the session alone where its token is already kept', async () => {
    rememberServerAddress('http://valence.local:8420');
    keepTheSessionToken('a-token');
    jest.mocked(fetchSession).mockResolvedValue(MARQUES);

    const drawn = await drawTheWayIn();

    expect(await drawn.findByText('Signed in as Marques')).toBeTruthy();
    expect(holdTheSession).not.toHaveBeenCalled();
  });

  it('signs out and forgets the server when somebody wants another', async () => {
    rememberServerAddress('http://valence.local:8420');
    jest.mocked(fetchSession).mockResolvedValue(MARQUES);

    const drawn = await drawTheWayIn();

    await userEvent.press(await drawn.findByRole('button', { name: 'Move server' }));

    expect(signOutHere).toHaveBeenCalledTimes(1);
    expect(await drawn.findByText('Which server')).toBeTruthy();
    await waitFor(() => {
      expect(serverAddress()).toBeNull();
    });
  });
});
