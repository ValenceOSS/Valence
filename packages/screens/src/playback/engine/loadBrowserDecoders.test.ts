import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('loadBrowserDecoders', () => {
  it('has nothing to offer where the server was built without its decoders', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(null, { status: 404 })));

    const { loadBrowserDecoders } =
      await import('@ValenceScreens/playback/engine/loadBrowserDecoders');

    expect(await loadBrowserDecoders()).toBeNull();
  });

  it('has nothing to offer where what it fetched is not WebAssembly', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(new Uint8Array([1, 2, 3]))));

    const { loadBrowserDecoders } =
      await import('@ValenceScreens/playback/engine/loadBrowserDecoders');

    expect(await loadBrowserDecoders()).toBeNull();
  });
});
