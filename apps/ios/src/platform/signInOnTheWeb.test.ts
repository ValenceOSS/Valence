import { requireOptionalNativeModule } from 'expo';
import { signInOnTheWeb } from './signInOnTheWeb';

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
});
