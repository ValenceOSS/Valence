import { render, userEvent, waitFor } from '@testing-library/react-native';
import { signInAsProfile } from '@ValenceClient/profiles/fetchEveryone';
import { verifyTotp } from '@ValenceClient/session/auth';
import { holdTheSession } from '@ValenceTv/session/holdTheSession';
import { EnterPassword } from '@ValenceTv/screens/EnterPassword/EnterPassword';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

jest.mock('@ValenceClient/session/auth', () => ({
  verifyTotp: jest.fn(),
  startDeviceGrant: jest.fn(() =>
    Promise.resolve({
      deviceCode: 'device-code',
      userCode: 'WDJB-MJHT',
      verificationUri: 'http://localhost:8420/device',
      verificationUriComplete: 'http://localhost:8420/device?user_code=WDJB-MJHT',
      intervalSeconds: 5,
      expiresInSeconds: 600,
    }),
  ),
  askWhetherTheDeviceMayIn: jest.fn(() => new Promise(() => undefined)),
}));

jest.mock('@ValenceClient/profiles/fetchEveryone', () => ({ signInAsProfile: jest.fn() }));

jest.mock('@ValenceTv/session/holdTheSession', () => ({
  holdTheSession: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@ValenceTv/layout/whereOnScreen', () => ({
  whereOnScreen: () => Promise.resolve({ x: 10, y: 20, width: 200, height: 200 }),
}));

const JO: ViewerProfile = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Jo',
  colour: '#3a8ee8',
  avatar: { kind: 'initial' },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};

const drawEnterPassword = (told: { onSignedIn?: () => void; onBack?: () => void } = {}) =>
  render(
    <EnterPassword
      profile={JO}
      onSignedIn={told.onSignedIn ?? jest.fn()}
      onBack={told.onBack ?? jest.fn()}
      isArriving={false}
      onFaceAt={jest.fn()}
      onMarkAt={jest.fn()}
    />,
  );

const typeInto = async (
  field: string,
  words: string,
  drawn: Awaited<ReturnType<typeof drawEnterPassword>>,
) => {
  const [, box] = drawn.getAllByLabelText(field);

  if (box !== undefined) {
    await userEvent.clear(box);
    await userEvent.type(box, words);
  }
};

beforeEach(() => {
  jest.mocked(signInAsProfile).mockReset();
  jest.mocked(verifyTotp).mockReset();
  jest.mocked(holdTheSession).mockClear();
});

describe('EnterPassword', () => {
  it('asks the face that was picked for its password', async () => {
    const drawn = await drawEnterPassword();

    expect(drawn.getByText('Jo')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Password' })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Watch' })).toBeDisabled();
  });

  it('signs in with the password and says where the face and mark are to fly on from', async () => {
    jest.mocked(signInAsProfile).mockResolvedValue({ kind: 'signedIn' });
    const onSignedIn = jest.fn();
    const drawn = await drawEnterPassword({ onSignedIn });

    await typeInto('Password', 'hunter2', drawn);
    await userEvent.press(drawn.getByRole('button', { name: 'Watch' }));

    expect(signInAsProfile).toHaveBeenCalledWith(JO.id, 'hunter2');
    await waitFor(() => {
      expect(onSignedIn).toHaveBeenCalledWith({
        face: { x: 10, y: 20, width: 200, height: 200 },
        mark: { x: 10, y: 20, width: 200, height: 200 },
      });
    });
    expect(holdTheSession).toHaveBeenCalledTimes(1);
  });

  it('says why a password was refused', async () => {
    jest
      .mocked(signInAsProfile)
      .mockResolvedValue({ kind: 'refused', reason: 'That password is not right.' });
    const onSignedIn = jest.fn();
    const drawn = await drawEnterPassword({ onSignedIn });

    await typeInto('Password', 'wrong', drawn);
    await userEvent.press(drawn.getByRole('button', { name: 'Watch' }));

    expect(await drawn.findByText('That password is not right.')).toBeTruthy();
    expect(onSignedIn).not.toHaveBeenCalled();
  });

  it('asks for the code from an authenticator where the account wants one', async () => {
    jest.mocked(signInAsProfile).mockResolvedValue({ kind: 'needsCode' });
    jest.mocked(verifyTotp).mockResolvedValue(true);
    const onSignedIn = jest.fn();
    const drawn = await drawEnterPassword({ onSignedIn });

    await typeInto('Password', 'hunter2', drawn);
    await userEvent.press(drawn.getByRole('button', { name: 'Watch' }));

    expect(
      await drawn.findByRole('button', { name: 'The code from your authenticator' }),
    ).toBeTruthy();

    await typeInto('The code from your authenticator', '123456', drawn);
    await userEvent.press(drawn.getByRole('button', { name: 'Watch' }));

    expect(verifyTotp).toHaveBeenCalledWith('123456');
    await waitFor(() => {
      expect(onSignedIn).toHaveBeenCalledTimes(1);
    });
  });

  it('starts the code box empty rather than holding the password', async () => {
    jest.mocked(signInAsProfile).mockResolvedValue({ kind: 'needsCode' });
    const drawn = await drawEnterPassword();

    await typeInto('Password', 'hunter2', drawn);
    await userEvent.press(drawn.getByRole('button', { name: 'Watch' }));
    await drawn.findByRole('button', { name: 'The code from your authenticator' });

    expect(drawn.queryByText('hunter2')).toBeNull();
    expect(drawn.queryByDisplayValue('hunter2')).toBeNull();
  });

  it('says so when the code is not right', async () => {
    jest.mocked(signInAsProfile).mockResolvedValue({ kind: 'needsCode' });
    jest.mocked(verifyTotp).mockResolvedValue(false);
    const drawn = await drawEnterPassword();

    await typeInto('Password', 'hunter2', drawn);
    await userEvent.press(drawn.getByRole('button', { name: 'Watch' }));
    await drawn.findByRole('button', { name: 'The code from your authenticator' });
    await typeInto('The code from your authenticator', '000000', drawn);
    await userEvent.press(drawn.getByRole('button', { name: 'Watch' }));

    expect(await drawn.findByText('That code is not right.')).toBeTruthy();
  });

  it('offers signing in from a phone beside the password', async () => {
    const drawn = await drawEnterPassword();

    expect(drawn.getByText('Use your phone')).toBeTruthy();
    expect(await drawn.findByText('WDJB-MJHT')).toBeTruthy();
    expect(drawn.getAllByLabelText('Password').length).toBeGreaterThan(0);
  });

  it('goes back to pick someone else', async () => {
    const onBack = jest.fn();
    const drawn = await drawEnterPassword({ onBack });

    await userEvent.press(drawn.getByRole('button', { name: 'Someone else' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
