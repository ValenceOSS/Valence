import { requireOptionalNativeModule } from 'expo';
import { theCookiesThisPhoneHolds } from './theCookiesThisPhoneHolds';

jest.unmock('@ValenceMobile/platform/theCookiesThisPhoneHolds');

jest.mock('expo', () => ({ requireOptionalNativeModule: jest.fn() }));

const cookieHeaderFor = jest.fn<Promise<string | null>, [string]>();

beforeEach(() => {
  cookieHeaderFor.mockReset();
  jest.mocked(requireOptionalNativeModule).mockReturnValue({ cookieHeaderFor });
});

describe('theCookiesThisPhoneHolds', () => {
  it('hands over what it holds, as a server would be sent it', async () => {
    cookieHeaderFor.mockResolvedValue('valence.session_token=abc');

    expect(await theCookiesThisPhoneHolds('https://valence.example')).toBe(
      'valence.session_token=abc',
    );
    expect(cookieHeaderFor).toHaveBeenCalledWith('https://valence.example');
  });

  it('says it holds none rather than sending an empty header', async () => {
    cookieHeaderFor.mockResolvedValue('');

    expect(await theCookiesThisPhoneHolds('https://valence.example')).toBeNull();
  });

  it('says it holds none where the jar could not be read', async () => {
    cookieHeaderFor.mockRejectedValue(new Error('no jar'));

    expect(await theCookiesThisPhoneHolds('https://valence.example')).toBeNull();
  });

  it('says it holds none where this build has no native code to read it with', async () => {
    jest.mocked(requireOptionalNativeModule).mockReturnValue(null);

    expect(await theCookiesThisPhoneHolds('https://valence.example')).toBeNull();
  });
});
