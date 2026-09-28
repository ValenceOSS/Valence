import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { signInOnTheWeb } from '@ValenceMobile/platform/signInOnTheWeb';
import { openOnThePhone } from './openOnThePhone';

jest.mock('@ValenceMobile/platform/signInOnTheWeb', () => ({ signInOnTheWeb: jest.fn() }));

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'https://valence.test' }));
});

describe('openOnThePhone', () => {
  it('opens a page of this server in the browser sheet', async () => {
    jest.mocked(signInOnTheWeb).mockResolvedValue(null);

    await openOnThePhone('/api/plugins/anilist/accounts/anilist/connect');

    expect(signInOnTheWeb).toHaveBeenCalledWith(
      'https://valence.test/api/plugins/anilist/accounts/anilist/connect',
    );
  });

  it('settles quietly however the sheet closed', async () => {
    jest.mocked(signInOnTheWeb).mockRejectedValue(new Error('No sheet'));

    await expect(openOnThePhone('/api/plugins/x/connect')).resolves.toBeUndefined();
  });

  it('opens nothing that is not a path on this server', async () => {
    jest.mocked(signInOnTheWeb).mockClear();

    await openOnThePhone('https://elsewhere.example/steal');

    expect(signInOnTheWeb).not.toHaveBeenCalled();
  });
});
