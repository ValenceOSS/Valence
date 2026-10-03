import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { answerDeviceRequest, readDeviceRequest } from '@ValenceClient/session/auth';
import { scanACode } from '@ValenceMobile/platform/scanACode';
import { SignInATelevision } from './SignInATelevision';

jest.mock('@ValenceMobile/platform/scanACode', () => ({ scanACode: jest.fn() }));

jest.mock('@ValenceClient/session/auth', () => ({
  ...jest.requireActual<object>('@ValenceClient/session/auth'),
  readDeviceRequest: jest.fn(),
  answerDeviceRequest: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  installPlatform(aFakePlatform());
  jest.mocked(readDeviceRequest).mockResolvedValue({ userCode: 'ABCD1234', status: 'pending' });
});

describe('SignInATelevision', () => {
  it('asks for the code on the television', async () => {
    const drawn = await render(<SignInATelevision />, { wrapper: CacheScope });

    expect(drawn.getByLabelText('Code shown on your TV')).toBeTruthy();
  });

  it('signs the television in once somebody says it is theirs', async () => {
    jest.mocked(answerDeviceRequest).mockResolvedValue(true);
    const drawn = await render(<SignInATelevision startsWith="ABCD1234" />, {
      wrapper: CacheScope,
    });

    await userEvent.press(await drawn.findByText('Yes, this was me'));

    expect(answerDeviceRequest).toHaveBeenCalledWith('ABCD1234', true);
    expect(await drawn.findByText(/Done\. The TV will be signed in shortly/u)).toBeTruthy();
  });

  it('turns a television down where somebody did not ask for it', async () => {
    jest.mocked(answerDeviceRequest).mockResolvedValue(true);
    const drawn = await render(<SignInATelevision startsWith="ABCD1234" />, {
      wrapper: CacheScope,
    });

    await userEvent.press(await drawn.findByText('No, this wasn’t me'));

    expect(answerDeviceRequest).toHaveBeenCalledWith('ABCD1234', false);
  });

  it('asks for the code to be typed where the television’s QR code carries only its address', async () => {
    jest
      .mocked(scanACode)
      .mockResolvedValue({ kind: 'read', text: 'https://valence.example/device' });
    const drawn = await render(<SignInATelevision />, { wrapper: CacheScope });

    await userEvent.press(drawn.getByLabelText('Scan the QR code'));

    expect(await drawn.findByText(/Enter the code the TV shows to confirm/u)).toBeTruthy();
    expect(readDeviceRequest).not.toHaveBeenCalled();
  });

  it('says a QR code that is no address at all is not a television’s', async () => {
    jest.mocked(scanACode).mockResolvedValue({ kind: 'read', text: '   ' });
    const drawn = await render(<SignInATelevision />, { wrapper: CacheScope });

    await userEvent.press(drawn.getByLabelText('Scan the QR code'));

    expect(await drawn.findByText('That QR code isn’t a Valence TV sign-in code.')).toBeTruthy();
  });
});
