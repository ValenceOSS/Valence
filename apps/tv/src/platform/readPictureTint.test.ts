import { readPictureTint } from '@ValenceTv/platform/readPictureTint';

describe('readPictureTint on a television', () => {
  it('reads nothing, since the picture itself lights the page', async () => {
    await expect(readPictureTint('/api/media/a/image/backdrop')).resolves.toBeNull();
  });
});
