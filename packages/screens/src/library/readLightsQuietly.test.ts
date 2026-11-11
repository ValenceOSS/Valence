import { afterEach, describe, expect, it, vi } from 'vitest';
import { readLightsQuietly } from './readLightsQuietly';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('readLightsQuietly', () => {
  it('finds nothing where the frame cannot be shrunk', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => Promise.reject(new Error('not decodable'))),
    );

    await expect(readLightsQuietly(document.createElement('video'))).resolves.toEqual([]);
  });

  it('shrinks the frame to the few pixels it reads before reading it', async () => {
    const close = vi.fn();
    const shrink = vi.fn(async () => Promise.resolve({ width: 48, height: 48, close }));

    vi.stubGlobal('createImageBitmap', shrink);

    await readLightsQuietly(document.createElement('img'));

    expect(shrink).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ resizeWidth: 48, resizeHeight: 48 }),
    );
    expect(close).toHaveBeenCalledOnce();
  });
});
