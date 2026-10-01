import { Image } from 'expo-image';
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
});
