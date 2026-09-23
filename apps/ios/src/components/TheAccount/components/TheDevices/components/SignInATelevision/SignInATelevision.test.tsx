import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { answerDeviceRequest, readDeviceRequest } from '@ValenceClient/session/auth';
import { SignInATelevision } from './SignInATelevision';

jest.mock('@ValenceClient/session/auth', () => ({
  ...jest.requireActual<object>('@ValenceClient/session/auth'),
  readDeviceRequest: jest.fn(),
  answerDeviceRequest: jest.fn(),
}));

beforeEach(() => {
  installPlatform(aFakePlatform());
  jest.mocked(readDeviceRequest).mockResolvedValue({ userCode: 'ABCD1234', status: 'pending' });
});

describe('SignInATelevision', () => {
  it('asks for the code on the television', async () => {
    const drawn = await render(<SignInATelevision />, { wrapper: CacheScope });

    expect(drawn.getByLabelText('The code on the television')).toBeTruthy();
  });

  it('signs the television in once somebody says it is theirs', async () => {
    jest.mocked(answerDeviceRequest).mockResolvedValue(true);
    const drawn = await render(<SignInATelevision startsWith="ABCD1234" />, {
      wrapper: CacheScope,
    });

    await userEvent.press(await drawn.findByText('Yes, that is mine'));

    expect(answerDeviceRequest).toHaveBeenCalledWith('ABCD1234', true);
    expect(await drawn.findByText(/Done\. The television should be watching/u)).toBeTruthy();
  });

  it('turns a television down where somebody did not ask for it', async () => {
    jest.mocked(answerDeviceRequest).mockResolvedValue(true);
    const drawn = await render(<SignInATelevision startsWith="ABCD1234" />, {
      wrapper: CacheScope,
    });

    await userEvent.press(await drawn.findByText('No, I did not ask for this'));

    expect(answerDeviceRequest).toHaveBeenCalledWith('ABCD1234', false);
  });
});
