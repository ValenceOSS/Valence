import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { shareTheSignIn } from './shareTheSignIn';

const mockShareSignIn = jest.fn((_address: string, _cookie: string) => true);

jest.mock('expo', () => ({
  requireOptionalNativeModule: () => ({ shareSignIn: mockShareSignIn, forgetSignIn: jest.fn() }),
}));

jest.mock('@ValenceMobile/platform/theCookiesThisPhoneHolds', () => ({
  theCookiesThisPhoneHolds: () => Promise.resolve('session=held'),
}));

describe('shareTheSignIn', () => {
  it('hands the extension the server and the session held there', async () => {
    installPlatform(aFakePlatform({ serverAddress: () => 'https://home.example' }));

    expect(await shareTheSignIn()).toBe(true);
    expect(mockShareSignIn).toHaveBeenCalledWith('https://home.example', 'session=held');
  });

  it('hands nothing over before the phone knows its server', async () => {
    installPlatform(aFakePlatform({ serverAddress: () => null }));

    expect(await shareTheSignIn()).toBe(false);
  });
});
