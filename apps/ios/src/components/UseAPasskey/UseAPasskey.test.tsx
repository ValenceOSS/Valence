import { render, userEvent, waitFor } from '@testing-library/react-native';
import { signInThroughTheBrowser } from '@ValencePhone/platform/signInThroughTheBrowser';
import { UseAPasskey } from './UseAPasskey';

jest.mock('@ValencePhone/platform/signInThroughTheBrowser', () => ({
  signInThroughTheBrowser: jest.fn(),
}));

beforeEach(() => {
  jest.mocked(signInThroughTheBrowser).mockReset().mockResolvedValue('in');
});

describe('UseAPasskey', () => {
  it('says what it was told to', async () => {
    const drawn = await render(<UseAPasskey label="Sign in with a passkey" onIn={jest.fn()} />);

    expect(drawn.getByRole('button', { name: 'Sign in with a passkey' })).toBeTruthy();
  });

  it('lets somebody in once the browser has signed them in', async () => {
    const onIn = jest.fn();
    const drawn = await render(<UseAPasskey label="Sign in with a passkey" onIn={onIn} />);

    await userEvent.press(drawn.getByRole('button', { name: 'Sign in with a passkey' }));

    await waitFor(() => {
      expect(onIn).toHaveBeenCalled();
    });
  });

  it('says so where it did not work', async () => {
    jest.mocked(signInThroughTheBrowser).mockResolvedValue('failed');

    const onIn = jest.fn();
    const drawn = await render(<UseAPasskey label="Sign in with a passkey" onIn={onIn} />);

    await userEvent.press(drawn.getByRole('button', { name: 'Sign in with a passkey' }));

    expect(await drawn.findByText('That did not sign you in. Try again.')).toBeTruthy();
    expect(onIn).not.toHaveBeenCalled();
  });

  it('says nothing where somebody closed the sheet', async () => {
    jest.mocked(signInThroughTheBrowser).mockResolvedValue('cancelled');

    const drawn = await render(<UseAPasskey label="Sign in with a passkey" onIn={jest.fn()} />);

    await userEvent.press(drawn.getByRole('button', { name: 'Sign in with a passkey' }));

    await waitFor(() => {
      expect(signInThroughTheBrowser).toHaveBeenCalled();
    });

    expect(drawn.queryByText('That did not sign you in. Try again.')).toBeNull();
  });
});
