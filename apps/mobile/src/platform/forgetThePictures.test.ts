import { Image } from 'expo-image';
import { heldCookies } from '@ValenceMobile/platform/heldCookies';
import { theCookiesThisPhoneHolds } from '@ValenceMobile/platform/theCookiesThisPhoneHolds';
import { forgetThePictures } from './forgetThePictures';

const emptyingMemory = jest.spyOn(Image, 'clearMemoryCache');
const emptyingDisk = jest.spyOn(Image, 'clearDiskCache');

beforeEach(() => {
  emptyingMemory.mockReset().mockResolvedValue(true);
  emptyingDisk.mockReset().mockResolvedValue(true);
});

describe('forgetThePictures', () => {
  it('empties the pictures kept in memory and on disk', async () => {
    await forgetThePictures();

    expect(emptyingMemory).toHaveBeenCalled();
    expect(emptyingDisk).toHaveBeenCalled();
  });

  it('carries on where the pictures could not be emptied', async () => {
    emptyingDisk.mockRejectedValue(new Error('no disk'));

    await expect(forgetThePictures()).resolves.toBeUndefined();
  });

  it('lets go of the cookies the pictures were fetched with', async () => {
    jest.mocked(theCookiesThisPhoneHolds).mockResolvedValue('valence.session_token=abc');
    await heldCookies.ask('https://valence.example/poster');

    await forgetThePictures();

    expect(heldCookies.now('https://valence.example/poster')).toBeUndefined();
  });
});
