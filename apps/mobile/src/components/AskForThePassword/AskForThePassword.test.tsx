import { render, userEvent, waitFor } from '@testing-library/react-native';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { signInAsProfile } from '@ValenceClient/profiles/fetchEveryone';
import { AskForThePassword } from './AskForThePassword';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

jest.mock('@ValenceClient/profiles/fetchEveryone', () => ({ signInAsProfile: jest.fn() }));

const A_FACE: ViewerProfile = {
  id: '176acd29-9b53-4193-831d-291bc7a9d4eb',
  name: 'Dan',
  colour: '#e8503a',
  avatar: { kind: 'initial' },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'http://one.local:8420' }));
  jest.mocked(signInAsProfile).mockReset();
});

afterEach(() => {
  forgetPlatform();
});

describe('AskForThePassword', () => {
  it('shows whose face is being signed in as', async () => {
    const drawn = await render(
      <AskForThePassword profile={A_FACE} onIn={jest.fn()} onBack={jest.fn()} />,
      { wrapper: CacheScope },
    );

    expect(drawn.getByText('Dan')).toBeTruthy();
  });

  it('signs in as the face that was picked', async () => {
    jest.mocked(signInAsProfile).mockResolvedValue({ kind: 'signedIn' });

    const onIn = jest.fn();
    const drawn = await render(
      <AskForThePassword profile={A_FACE} onIn={onIn} onBack={jest.fn()} />,
      { wrapper: CacheScope },
    );

    await userEvent.type(drawn.getByLabelText('Password'), 'hunter2');
    await userEvent.press(drawn.getByText('Watch'));

    await waitFor(() => {
      expect(signInAsProfile).toHaveBeenCalledWith(A_FACE.id, 'hunter2');
    });
    expect(onIn).toHaveBeenCalled();
  });

  it('says why it was refused, rather than doing nothing', async () => {
    jest
      .mocked(signInAsProfile)
      .mockResolvedValue({ kind: 'refused', reason: 'That password is not right.' });

    const drawn = await render(
      <AskForThePassword profile={A_FACE} onIn={jest.fn()} onBack={jest.fn()} />,
      { wrapper: CacheScope },
    );

    await userEvent.type(drawn.getByLabelText('Password'), 'hunter2');
    await userEvent.press(drawn.getByText('Watch'));

    await waitFor(() => {
      expect(drawn.getByText('That password is not right.')).toBeTruthy();
    });
  });

  it('goes on to ask for the code where the account has a second factor', async () => {
    jest.mocked(signInAsProfile).mockResolvedValue({ kind: 'needsCode' });

    const onIn = jest.fn();
    const drawn = await render(
      <AskForThePassword profile={A_FACE} onIn={onIn} onBack={jest.fn()} />,
      { wrapper: CacheScope },
    );

    await userEvent.type(drawn.getByLabelText('Password'), 'hunter2');
    await userEvent.press(drawn.getByText('Watch'));

    await waitFor(() => {
      expect(drawn.getByLabelText('Authenticator code')).toBeTruthy();
    });

    expect(onIn).not.toHaveBeenCalled();
  });

  it('does not say it is through where it was refused', async () => {
    jest.mocked(signInAsProfile).mockResolvedValue({ kind: 'refused', reason: 'No.' });

    const onIn = jest.fn();
    const drawn = await render(
      <AskForThePassword profile={A_FACE} onIn={onIn} onBack={jest.fn()} />,
      { wrapper: CacheScope },
    );

    await userEvent.type(drawn.getByLabelText('Password'), 'hunter2');
    await userEvent.press(drawn.getByText('Watch'));

    await waitFor(() => {
      expect(drawn.getByText('No.')).toBeTruthy();
    });
    expect(onIn).not.toHaveBeenCalled();
  });

  it('offers a way back to the other faces', async () => {
    const onBack = jest.fn();
    const drawn = await render(
      <AskForThePassword profile={A_FACE} onIn={jest.fn()} onBack={onBack} />,
      { wrapper: CacheScope },
    );

    await userEvent.press(drawn.getByText('Somebody else'));

    expect(onBack).toHaveBeenCalled();
  });

  it('offers a passkey instead of the password', async () => {
    const drawn = await render(
      <AskForThePassword profile={A_FACE} onIn={jest.fn()} onBack={jest.fn()} />,
      { wrapper: CacheScope },
    );

    expect(drawn.getByRole('button', { name: 'Use a passkey instead' })).toBeTruthy();
  });
});
