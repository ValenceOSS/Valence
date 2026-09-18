import { describe, expect, it, vi } from 'vitest';
import { createMusicWeb } from './createMusicWeb';
import type { WebFetch } from './createMusicWeb';

const answering =
  (...answers: Response[]): WebFetch =>
  () =>
    Promise.resolve(answers.shift() ?? new Response(null, { status: 404 }));

describe('createMusicWeb', () => {
  it('says who is asking', async () => {
    const fetchImpl = vi.fn<WebFetch>(() => Promise.resolve(Response.json({ ok: true })));
    const web = createMusicWeb({ userAgent: 'Valence/1.0', spacingMs: {}, fetchImpl });

    await web.json('https://musicbrainz.org/ws/2/x');

    expect(fetchImpl.mock.calls[0]?.[0]).toBe('https://musicbrainz.org/ws/2/x');
    expect(fetchImpl.mock.calls[0]?.[1].headers).toEqual({
      'user-agent': 'Valence/1.0',
      accept: 'application/json',
    });
    expect(fetchImpl.mock.calls[0]?.[1].signal).toBeInstanceOf(AbortSignal);
  });

  it('reads JSON and pictures', async () => {
    const web = createMusicWeb({
      userAgent: 'x',
      spacingMs: {},
      fetchImpl: answering(Response.json({ a: 1 }), new Response(new Uint8Array([1, 2, 3]))),
    });

    expect(await web.json('https://a.test/')).toEqual({ a: 1 });
    expect(await web.bytes('https://a.test/')).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('answers nothing for a refusal or a site it cannot reach', async () => {
    const web = createMusicWeb({
      userAgent: 'x',
      spacingMs: {},
      fetchImpl: async (url) =>
        url.includes('down')
          ? Promise.reject(new Error('down'))
          : new Response(null, { status: 404 }),
    });

    expect(await web.json('https://a.test/missing')).toBeNull();
    expect(await web.bytes('https://down.test/')).toBeNull();
  });

  it('spaces requests to one site as far apart as it asks', async () => {
    let clock = 0;
    const waited: number[] = [];
    const web = createMusicWeb({
      userAgent: 'x',
      spacingMs: { 'musicbrainz.org': 1000 },
      fetchImpl: () => Promise.resolve(Response.json({})),
      now: () => clock,
      wait: (ms) => {
        waited.push(ms);
        clock += ms;

        return Promise.resolve();
      },
    });

    await Promise.all([
      web.json('https://musicbrainz.org/a'),
      web.json('https://musicbrainz.org/b'),
    ]);

    expect(waited).toEqual([1000]);
  });

  it('gives a busy site a moment and asks again', async () => {
    const web = createMusicWeb({
      userAgent: 'x',
      spacingMs: {},
      fetchImpl: answering(new Response(null, { status: 503 }), Response.json({ at: 'last' })),
      wait: () => Promise.resolve(),
    });

    expect(await web.json('https://a.test/')).toEqual({ at: 'last' });
  });

  it('gives up on a site that does not answer', async () => {
    const web = createMusicWeb({
      userAgent: 'x',
      spacingMs: {},
      timeoutMs: 10,
      fetchImpl: async (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal.addEventListener('abort', () => {
            reject(new Error('timed out'));
          });
        }),
    });

    expect(await web.bytes('https://slow.test/')).toBeNull();
  });
});
