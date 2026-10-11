import { afterEach, describe, expect, it, vi } from 'vitest';

const decode = vi.fn(() => ({ frames: new Uint8Array(6), count: 1, width: 2, height: 2 }));

vi.mock('@ValenceScreens/playback/engine/loadBrowserDecoders', () => ({
  loadBrowserDecoders: () => Promise.resolve({ createMpeg2: () => ({ decode, free: vi.fn() }) }),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('mpeg2Worker', () => {
  it('decodes a stream it is sent and posts the frames back to the page', async () => {
    const postMessage = vi.spyOn(globalThis, 'postMessage').mockImplementation(() => undefined);

    await import('@ValenceScreens/playback/engine/mpeg2/mpeg2Worker');
    globalThis.dispatchEvent(
      new MessageEvent('message', { data: { kind: 'decode', id: 7, stream: new ArrayBuffer(4) } }),
    );

    await vi.waitFor(() => {
      expect(postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ id: 7, count: 1, width: 2, height: 2 }),
        expect.anything(),
      );
    });
    expect(decode).toHaveBeenCalledTimes(1);
  });
});
