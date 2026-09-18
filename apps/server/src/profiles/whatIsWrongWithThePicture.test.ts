import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import {
  MOST_BYTES,
  MOST_PIXELS_AN_EDGE,
  contentTypeFor,
  extensionFor,
  whatIsWrongWithThePicture,
} from './whatIsWrongWithThePicture';

const aPicture = async (width = 8, height = 8): Promise<Uint8Array> =>
  new Uint8Array(
    await sharp({ create: { width, height, channels: 3, background: { r: 0, g: 0, b: 0 } } })
      .png()
      .toBuffer(),
  );

describe('the kinds of picture a face may be', () => {
  it('takes the still formats a browser can draw', () => {
    expect(extensionFor('image/png')).toBe('.png');
    expect(extensionFor('image/jpeg')).toBe('.jpg');
    expect(extensionFor('image/webp')).toBe('.webp');
    expect(extensionFor('image/avif')).toBe('.avif');
    expect(extensionFor('image/gif')).toBe('.gif');
  });

  it('reads the kind back from the extension it was kept under', () => {
    expect(contentTypeFor('.jpg')).toBe('image/jpeg');
    expect(contentTypeFor('.avif')).toBe('image/avif');
    expect(contentTypeFor('.exe')).toBeUndefined();
  });

  it('takes no clip, since a face is a still picture', () => {
    expect(extensionFor('video/mp4')).toBeUndefined();
    expect(extensionFor('video/webm')).toBeUndefined();
  });
});

describe('what is wrong with a picture', () => {
  it('finds nothing wrong with an ordinary one', async () => {
    await expect(
      whatIsWrongWithThePicture({ body: await aPicture(), contentType: 'image/png' }),
    ).resolves.toBeNull();
  });

  it('names the kind as the fault where the kind is not taken', async () => {
    await expect(
      whatIsWrongWithThePicture({ body: await aPicture(), contentType: 'video/mp4' }),
    ).resolves.toBe('notAPicture');
  });

  it('weighs a picture before reading it, so an enormous file is never decoded', async () => {
    await expect(
      whatIsWrongWithThePicture({
        body: new Uint8Array(MOST_BYTES + 1),
        contentType: 'image/png',
      }),
    ).resolves.toBe('tooLarge');
  });

  it('names the detail as the fault where an edge is longer than anything will draw', async () => {
    await expect(
      whatIsWrongWithThePicture({
        body: await aPicture(MOST_PIXELS_AN_EDGE + 1, 4),
        contentType: 'image/png',
      }),
    ).resolves.toBe('tooDetailed');
  });

  it('allows a picture sitting exactly on the limit', async () => {
    await expect(
      whatIsWrongWithThePicture({
        body: await aPicture(MOST_PIXELS_AN_EDGE, 4),
        contentType: 'image/png',
      }),
    ).resolves.toBeNull();
  });

  it('takes more detail where the picture is allowed it, and still refuses beyond that', async () => {
    const wider = { mostBytes: MOST_BYTES, mostPixelsAnEdge: MOST_PIXELS_AN_EDGE * 2 };

    await expect(
      whatIsWrongWithThePicture(
        { body: await aPicture(MOST_PIXELS_AN_EDGE + 1, 4), contentType: 'image/png' },
        wider,
      ),
    ).resolves.toBeNull();
    await expect(
      whatIsWrongWithThePicture(
        { body: await aPicture(MOST_PIXELS_AN_EDGE * 2 + 1, 4), contentType: 'image/png' },
        wider,
      ),
    ).resolves.toBe('tooDetailed');
  });

  it('reads the bytes rather than trusting what they claim to be', async () => {
    await expect(
      whatIsWrongWithThePicture({
        body: new TextEncoder().encode('not a picture at all'),
        contentType: 'image/png',
      }),
    ).resolves.toBe('unreadable');
  });
});
