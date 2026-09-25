import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { signInInATab } from '@ValenceMobile/platform/signInInATab';
import { signInOnTheWeb } from './signInOnTheWeb';

jest.mock('@ValenceMobile/platform/signInInATab', () => ({ signInInATab: jest.fn() }));

jest.mock('expo', () => ({
  ...jest.requireActual<object>('expo'),
  requireOptionalNativeModule: jest.fn(),
}));

const opening = jest.fn<Promise<string | null>, [string]>();

beforeEach(() => {
  jest.mocked(requireOptionalNativeModule).mockReset();
  opening.mockReset().mockResolvedValue('valence://signed-in?code=abc');
});

describe('signInOnTheWeb', () => {
  it('opens the page in the sheet and answers with where it came back to', async () => {
    jest.mocked(requireOptionalNativeModule).mockReturnValue({ signInOnTheWeb: opening });

    expect(await signInOnTheWeb('https://valence.example/phone-sign-in')).toBe(
      'valence://signed-in?code=abc',
    );
    expect(opening).toHaveBeenCalledWith('https://valence.example/phone-sign-in');
  });

  it('asks for the one piece of Swift that knows how', async () => {
    jest.mocked(requireOptionalNativeModule).mockReturnValue({ signInOnTheWeb: opening });

    await signInOnTheWeb('https://valence.example/phone-sign-in');

    expect(requireOptionalNativeModule).toHaveBeenCalledWith('ValenceWebSignIn');
  });

  it('refuses in a build without it', async () => {
    jest.mocked(requireOptionalNativeModule).mockReturnValue(null);

    await expect(signInOnTheWeb('https://valence.example/phone-sign-in')).rejects.toThrow(
      'This build cannot open the browser sheet.',
    );
  });

  it('opens a Chrome tab on Android instead of the sheet', async () => {
    const was = Platform.OS;
    const openInATab = jest.fn(() => Promise.resolve());

    Platform.OS = 'android';
    jest.mocked(requireOptionalNativeModule).mockReturnValue({ openInATab });
    jest.mocked(signInInATab).mockResolvedValue('valence://signed-in?code=abc');

    expect(await signInOnTheWeb('https://valence.example/phone-sign-in')).toBe(
      'valence://signed-in?code=abc',
    );
    expect(signInInATab).toHaveBeenCalledWith('https://valence.example/phone-sign-in', openInATab);

    Platform.OS = was;
  });
});
