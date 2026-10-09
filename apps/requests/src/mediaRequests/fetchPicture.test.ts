import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPicture } from './fetchPicture';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchPicture', () => {
  it('fetches a picture’s bytes, and nothing where the web will not give them', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        Promise.resolve(
          url.endsWith('/good.jpg')
            ? new Response(new Uint8Array([1, 2, 3]))
            : new Response(null, { status: 404 }),
        ),
      ),
    );

    expect(await fetchPicture('https://example.org/good.jpg')).toEqual(new Uint8Array([1, 2, 3]));
    expect(await fetchPicture('https://example.org/gone.jpg')).toBeNull();
  });
});
