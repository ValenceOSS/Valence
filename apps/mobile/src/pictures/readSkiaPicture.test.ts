import { Skia } from '@shopify/react-native-skia';
import { readSkiaPicture } from './readSkiaPicture';

describe('readSkiaPicture', () => {
  it('reads a picture once however many places ask for it', async () => {
    const fromURI = jest.spyOn(Skia.Data, 'fromURI');

    await readSkiaPicture('file:///once.jpg');
    await readSkiaPicture('file:///once.jpg');

    expect(fromURI).toHaveBeenCalledTimes(1);

    fromURI.mockRestore();
  });

  it('keeps only the last few, reading an older one again', async () => {
    const fromURI = jest.spyOn(Skia.Data, 'fromURI');

    await readSkiaPicture('file:///first.jpg');
    await readSkiaPicture('file:///second.jpg');
    await readSkiaPicture('file:///third.jpg');
    await readSkiaPicture('file:///fourth.jpg');
    await readSkiaPicture('file:///first.jpg');

    expect(fromURI).toHaveBeenCalledTimes(5);

    fromURI.mockRestore();
  });

  it('gives nothing for a picture the server refuses, asking for it again next time', async () => {
    const fetched = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 404 }));

    await expect(readSkiaPicture('http://192.168.1.36:8420/missing.webp')).resolves.toBeNull();
    expect(fetched).toHaveBeenCalledWith('http://192.168.1.36:8420/missing.webp', {});

    fetched.mockRestore();
  });
});
