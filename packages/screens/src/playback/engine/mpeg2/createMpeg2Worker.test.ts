import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMpeg2Worker } from '@ValenceScreens/playback/engine/mpeg2/createMpeg2Worker';

const posted: { kind: string; id?: number }[] = [];

afterEach(() => {
  vi.unstubAllGlobals();
  posted.length = 0;
});

describe('createMpeg2Worker', () => {
  it('sends a stream to its worker and answers with the frames that come back', async () => {
    vi.stubGlobal(
      'Worker',
      class extends EventTarget {
        terminate = vi.fn();
        postMessage(message: { kind: string; id?: number }) {
          posted.push(message);
          queueMicrotask(() => {
            this.dispatchEvent(
              new MessageEvent('message', {
                data: {
                  id: message.id,
                  frames: new ArrayBuffer(12),
                  count: 2,
                  width: 2,
                  height: 2,
                },
              }),
            );
          });
        }
      },
    );

    const worker = createMpeg2Worker();
    const decoded = await worker.decode(Uint8Array.from([0, 0, 1, 0xb3]));

    expect(posted[0]).toMatchObject({ kind: 'decode', id: 0 });
    expect(decoded).toMatchObject({ count: 2, width: 2, height: 2 });
    expect(decoded.frames.byteLength).toBe(12);
  });
});
