import { afterEach, describe, expect, it, vi } from 'vitest';
import { readClipFraming } from './readClipFraming';

/**
 * Answers the next request as the server would.
 *
 * @param status - The status it answers with.
 * @param framing - The framing header it sends, where it sends one.
 */
const answering = (status: number, framing?: string) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(
        new Response(status === 202 ? '{}' : '#EXTM3U', {
          status,
          headers: framing === undefined ? {} : { 'x-valence-picture-framing': framing },
        }),
      ),
    ),
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('readClipFraming', () => {
  it('reads how the picture sits in its frame', async () => {
    answering(200, '640,360,44,0,44,0');

    expect(await readClipFraming('/clip')).toEqual({
      state: 'ready',
      framing: { wide: 640, high: 360, top: 44, right: 0, bottom: 44, left: 0 },
    });
  });

  it('says a clip is ready without a framing the server has not measured yet', async () => {
    answering(200);

    expect(await readClipFraming('/clip')).toEqual({ state: 'ready', framing: null });
  });

  it('tells a clip still being made from one that is not coming', async () => {
    answering(202);
    expect((await readClipFraming('/clip')).state).toBe('pending');

    answering(404);
    expect((await readClipFraming('/clip')).state).toBe('absent');
  });

  it('ignores a framing it cannot read', async () => {
    answering(200, '640,abc');

    expect((await readClipFraming('/clip')).framing).toBeNull();
  });
});
