import { describe, expect, it, vi } from 'vitest';
import { createMusicWeb } from './createMusicWeb';
import type { WebFetch } from './createMusicWeb';
import { troubleWatch } from '@ValenceServer/sources/troubleWatch';

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

  it('sends a query as JSON and reads the answer', async () => {
    const fetchImpl = vi.fn<WebFetch>(() => Promise.resolve(Response.json({ data: 1 })));
    const web = createMusicWeb({ userAgent: 'x', spacingMs: {}, fetchImpl });

    expect(await web.post('https://graphql.test/', { query: 'q' })).toEqual({ data: 1 });
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      body: '{"query":"q"}',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
    });
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

  it('counts a site it cannot reach or that is failing, but not one that has nothing', async () => {
    const web = createMusicWeb({
      userAgent: 'x',
      spacingMs: {},
      fetchImpl: async (url) =>
        url.includes('down')
          ? Promise.reject(new Error('down'))
          : new Response(null, { status: url.includes('broken') ? 500 : 404 }),
      wait: () => Promise.resolve(),
    });

    await web.json('https://a.test/missing');

    expect(web.failures?.()).toBe(0);

    await web.json('https://down.test/');
    await web.json('https://broken.test/');

    expect(web.failures?.()).toBe(2);
  });

  it('says, for one ask, when the site could not be reached rather than refused or had nothing', async () => {
    const web = createMusicWeb({
      userAgent: 'x',
      spacingMs: {},
      fetchImpl: async (url) =>
        url.includes('down')
          ? Promise.reject(new Error('down'))
          : url.includes('busy')
            ? new Response(null, { status: 503 })
            : url.includes('long')
              ? new Response(null, { status: 414 })
              : Response.json({ found: [] }),
      wait: () => Promise.resolve(),
    });

    expect(await web.reachJson?.('https://down.test/')).toBeUndefined();
    expect(await web.reachJson?.('https://busy.test/')).toBeUndefined();
    expect(await web.reachJson?.('https://a.test/long')).toBeNull();
    expect(await web.reachJson?.('https://a.test/')).toEqual({ found: [] });
  });

  it('counts a site that stayed busy however often it was asked again', async () => {
    const web = createMusicWeb({
      userAgent: 'x',
      spacingMs: {},
      fetchImpl: () => Promise.resolve(new Response(null, { status: 503 })),
      wait: () => Promise.resolve(),
    });

    await web.json('https://a.test/');

    expect(web.failures?.()).toBe(1);
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

  it.each([
    ['unreachable', () => Promise.reject(new Error('offline'))],
    ['faulty', () => Promise.resolve(new Response(null, { status: 500 }))],
    ['rateLimited', () => Promise.resolve(new Response(null, { status: 429 }))],
    ['keyRefused', () => Promise.resolve(new Response(null, { status: 401 }))],
    ['refused', () => Promise.resolve(new Response(null, { status: 403 }))],
  ] as const)('reports a site that is %s, naming it', async (reason, fetchImpl) => {
    const web = createMusicWeb({
      userAgent: 'x',
      spacingMs: {},
      fetchImpl,
      wait: () => Promise.resolve(),
    });

    const { value, trouble } = await troubleWatch.during(() =>
      web.json('https://musicbrainz.org/ws/2/x'),
    );

    expect(value).toBeNull();
    expect(trouble).toEqual({ source: 'MusicBrainz', reason });
  });

  it('reports MusicBrainz staying busy as rate limiting, which is what its 503 means', async () => {
    const web = createMusicWeb({
      userAgent: 'x',
      spacingMs: {},
      fetchImpl: () => Promise.resolve(new Response(null, { status: 503 })),
      wait: () => Promise.resolve(),
    });

    const { trouble } = await troubleWatch.during(() => web.json('https://musicbrainz.org/ws/2/x'));

    expect(trouble).toEqual({ source: 'MusicBrainz', reason: 'rateLimited' });
  });

  it('reports nothing for a site that only has nothing', async () => {
    const web = createMusicWeb({ userAgent: 'x', spacingMs: {}, fetchImpl: answering() });

    const { trouble } = await troubleWatch.during(() => web.json('https://musicbrainz.org/ws/2/x'));

    expect(trouble).toBeNull();
  });
});
