import { afterEach, describe, expect, it, vi } from 'vitest';
import { readPickedPicture } from './readPickedPicture';

const LIMITS = { mostBytes: 6 * 1024 * 1024, mostPixelsAnEdge: 4096 };

const aFile = (bytes: number, type = 'image/png') =>
  new File([new Uint8Array(bytes)], 'face.png', { type });

const measured = (width: number, height: number) => {
  const close = vi.fn();

  vi.stubGlobal('createImageBitmap', () => Promise.resolve({ width, height, close }));

  return close;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('readPickedPicture', () => {
  it('turns away a picture larger than allowed before reading it', async () => {
    await expect(readPickedPicture(aFile(7 * 1024 * 1024), LIMITS)).resolves.toEqual({
      refusal: 'The picture must be 6 MB or smaller.',
    });
  });

  it('turns away a file that is not a kind of picture kept', async () => {
    await expect(readPickedPicture(aFile(10, 'image/tiff'), LIMITS)).resolves.toEqual({
      refusal: 'The picture must be a JPEG, PNG, WebP, AVIF or GIF.',
    });
  });

  it('turns away a picture with more pixels than allowed', async () => {
    const close = measured(5000, 1000);

    await expect(readPickedPicture(aFile(10), LIMITS)).resolves.toEqual({
      refusal: 'The picture must be 4096 × 4096 pixels or smaller.',
    });
    expect(close).toHaveBeenCalled();
  });

  it('places a small picture, or a GIF, as it is', async () => {
    measured(800, 600);

    const small = aFile(10);

    await expect(readPickedPicture(small, LIMITS)).resolves.toEqual({
      picture: small,
      preview: small,
    });

    measured(3000, 2000);

    const moving = aFile(10, 'image/gif');

    await expect(readPickedPicture(moving, LIMITS)).resolves.toEqual({
      picture: moving,
      preview: moving,
    });
  });

  it('places a large picture by a smaller copy, but sends the picture chosen', async () => {
    measured(4000, 2000);

    const sizes: { width: number; height: number }[] = [];

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
      this: HTMLCanvasElement,
      done,
    ) {
      sizes.push({ width: this.width, height: this.height });
      done(new Blob(['small'], { type: 'image/webp' }));
    });

    const large = aFile(10);
    const read = await readPickedPicture(large, LIMITS);

    expect(read).toMatchObject({ picture: large });
    expect('preview' in read && read.preview.type).toBe('image/webp');
    expect(sizes).toEqual([{ width: 1600, height: 800 }]);
  });

  it('turns away a file the browser cannot read as a picture', async () => {
    vi.stubGlobal('createImageBitmap', () => Promise.reject(new Error('broken')));

    await expect(readPickedPicture(aFile(10), LIMITS)).resolves.toEqual({
      refusal: 'Couldn’t read the file as a picture.',
    });
  });
});
