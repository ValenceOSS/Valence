import { render, userEvent, waitFor } from '@testing-library/react-native';
import { verifyBackupCode, verifyTotp } from '@ValenceClient/session/auth';
import { AskForTheCode } from './AskForTheCode';

jest.mock('@ValenceClient/session/auth');

beforeEach(() => {
  jest.mocked(verifyTotp).mockReset().mockResolvedValue(true);
  jest.mocked(verifyBackupCode).mockReset().mockResolvedValue(true);
});

describe('AskForTheCode', () => {
  it('asks for the authenticator code first', async () => {
    const drawn = await render(<AskForTheCode onIn={jest.fn()} onBack={jest.fn()} />);

    expect(drawn.getByLabelText('Authenticator code')).toBeTruthy();
  });

  it('lets them in once the code is accepted', async () => {
    const onIn = jest.fn();
    const drawn = await render(<AskForTheCode onIn={onIn} onBack={jest.fn()} />);

    await userEvent.type(drawn.getByLabelText('Authenticator code'), '123456');
    await userEvent.press(drawn.getByText('Continue'));

    await waitFor(() => {
      expect(onIn).toHaveBeenCalled();
    });
    expect(verifyTotp).toHaveBeenCalledWith('123456');
  });

  it('says so where the code was not accepted', async () => {
    jest.mocked(verifyTotp).mockResolvedValue(false);

    const onIn = jest.fn();
    const drawn = await render(<AskForTheCode onIn={onIn} onBack={jest.fn()} />);

    await userEvent.type(drawn.getByLabelText('Authenticator code'), '000000');
    await userEvent.press(drawn.getByText('Continue'));

    await waitFor(() => {
      expect(drawn.getByText('That code is not valid. Try the next one.')).toBeTruthy();
    });
    expect(onIn).not.toHaveBeenCalled();
  });

  it('asks for something before sending nothing', async () => {
    const drawn = await render(<AskForTheCode onIn={jest.fn()} onBack={jest.fn()} />);

    await userEvent.press(drawn.getByText('Continue'));

    expect(drawn.getByText('Enter the code from your authenticator app.')).toBeTruthy();
    expect(verifyTotp).not.toHaveBeenCalled();
  });

  it('takes a backup code from somebody who has lost their authenticator', async () => {
    const onIn = jest.fn();
    const drawn = await render(<AskForTheCode onIn={onIn} onBack={jest.fn()} />);

    await userEvent.press(drawn.getByText('Use a backup code instead'));
    await userEvent.type(drawn.getByLabelText('Backup code'), 'abcd-efgh');
    await userEvent.press(drawn.getByText('Continue'));

    await waitFor(() => {
      expect(onIn).toHaveBeenCalled();
    });
    expect(verifyBackupCode).toHaveBeenCalledWith('abcd-efgh');
  });

  it('says so where the server could not be reached', async () => {
    jest.mocked(verifyTotp).mockRejectedValue(new Error('gone'));

    const drawn = await render(<AskForTheCode onIn={jest.fn()} onBack={jest.fn()} />);

    await userEvent.type(drawn.getByLabelText('Authenticator code'), '123456');
    await userEvent.press(drawn.getByText('Continue'));

    await waitFor(() => {
      expect(
        drawn.getByText('Could not reach the server. Check that it is still running.'),
      ).toBeTruthy();
    });
  });
});
