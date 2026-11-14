import { describe, expect, it, vi } from 'vitest';
import { PinnedRequestRefusal } from '@ValenceCore/network/PinnedRequestRefusal';
import { fetchPicture } from '@ValenceRequests/mediaRequests/fetchPicture';

describe('fetchPicture', () => {
  it('gives the bytes of a picture that is fetched', async () => {
    const reach = vi.fn(() => Promise.resolve(new Response(new Uint8Array([1, 2, 3]))));

    expect(await fetchPicture('https://covers.example/a.jpg', reach)).toEqual(
      new Uint8Array([1, 2, 3]),
    );
  });

  it('gives nothing where the address is refused or does not answer well', async () => {
    const refused = vi.fn(() =>
      Promise.reject(new PinnedRequestRefusal('resolvesPrivately', '10.0.0.5')),
    );
    const missing = vi.fn(() => Promise.resolve(new Response('no', { status: 404 })));

    expect(await fetchPicture('http://10.0.0.5/a.jpg', refused)).toBeNull();
    expect(await fetchPicture('https://covers.example/a.jpg', missing)).toBeNull();
  });
});
