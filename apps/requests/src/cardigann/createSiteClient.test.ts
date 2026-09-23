import iconv from 'iconv-lite';
import { describe, expect, it, vi } from 'vitest';
import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import type { Solver } from '@ValenceRequests/solver/createSolver';
import { createSiteClient } from './createSiteClient';
import type { SiteFetch } from './createSiteClient';
import type { SiteSession } from './SiteSession';

type Reply = { status?: number; body?: string | Uint8Array; headers?: [string, string][] };

/**
 * A network that answers each address with the reply given, recording what it was asked.
 */
const aNetwork = (replies: Record<string, Reply | Reply[]>) => {
  const asked: { url: string; init: Parameters<SiteFetch>[1] }[] = [];
  const fetch = vi.fn<SiteFetch>((url, init) => {
    asked.push({ url, init });

    const entry = replies[url];
    const reply = Array.isArray(entry) ? entry.shift() : entry;

    if (reply === undefined) {
      return Promise.reject(new TypeError('fetch failed'));
    }

    const headers = new Headers();

    for (const [name, value] of reply.headers ?? []) {
      headers.append(name, value);
    }

    return Promise.resolve(
      new Response(reply.body ?? '', { status: reply.status ?? 200, headers }),
    );
  });

  return { fetch, asked };
};

/**
 * A fresh session.
 */
const aSession = (cookies: Record<string, string> = {}): SiteSession => ({
  cookies,
  userAgent: null,
});

const OPTIONS = { encoding: 'UTF-8', timeoutSeconds: 30, followRedirects: true };

describe('createSiteClient', () => {
  it('asks with the session’s cookies, and keeps the ones it is given', async () => {
    const { fetch, asked } = aNetwork({
      'https://x.example/': {
        body: 'hello',
        headers: [
          ['set-cookie', 'uid=1; Path=/'],
          ['set-cookie', 'pass=abc; HttpOnly'],
        ],
      },
    });
    const session = aSession({ theme: 'dark' });
    const response = await createSiteClient({ fetch }).send(
      { url: 'https://x.example/', method: 'GET', body: null, headers: {} },
      { ...OPTIONS, session, referer: 'https://x.example/' },
    );

    expect(response).toMatchObject({ status: 200, body: 'hello', redirectedTo: null });
    expect(session.cookies).toEqual({ theme: 'dark', uid: '1', pass: 'abc' });
    expect(asked[0]?.init.headers).toMatchObject({
      cookie: 'theme=dark',
      referer: 'https://x.example/',
    });
  });

  it('forgets cookies a site expires', async () => {
    const { fetch } = aNetwork({
      'https://x.example/': {
        headers: [
          ['set-cookie', 'a=gone; Max-Age=0'],
          ['set-cookie', 'b=old; Expires=Thu, 01 Jan 1970 00:00:00 GMT'],
          ['set-cookie', 'c=deleted'],
          ['set-cookie', '=nameless'],
        ],
      },
    });
    const session = aSession({ a: '1', b: '2', c: '3', d: '4' });

    await createSiteClient({ fetch }).send(
      { url: 'https://x.example/', method: 'GET', body: null, headers: {} },
      { ...OPTIONS, session },
    );

    expect(session.cookies).toEqual({ d: '4' });
  });

  it('follows redirects itself, keeping cookies set along the way', async () => {
    const { fetch, asked } = aNetwork({
      'https://x.example/login': {
        status: 302,
        headers: [
          ['location', '/home'],
          ['set-cookie', 'sid=9'],
        ],
      },
      'https://x.example/home': { body: 'welcome' },
    });
    const session = aSession();
    const response = await createSiteClient({ fetch }).send(
      { url: 'https://x.example/login', method: 'POST', body: 'u=ada', headers: {} },
      { ...OPTIONS, session },
    );

    expect(response).toMatchObject({ body: 'welcome', redirectedTo: 'https://x.example/home' });
    expect(session.cookies).toEqual({ sid: '9' });
    expect(asked[1]?.init).toMatchObject({ method: 'GET', headers: { cookie: 'sid=9' } });
  });

  it('keeps the method and body across a 307', async () => {
    const { fetch, asked } = aNetwork({
      'https://x.example/a': { status: 307, headers: [['location', 'https://x.example/b']] },
      'https://x.example/b': { body: 'ok' },
    });

    await createSiteClient({ fetch }).send(
      { url: 'https://x.example/a', method: 'POST', body: 'q=1', headers: {} },
      { ...OPTIONS, session: aSession() },
    );

    expect(asked[1]?.init).toMatchObject({ method: 'POST', body: 'q=1' });
  });

  it('says where it would have been sent, where it is not to follow', async () => {
    const { fetch } = aNetwork({
      'https://x.example/s': { status: 302, headers: [['location', '/login.php']] },
    });
    const response = await createSiteClient({ fetch }).send(
      { url: 'https://x.example/s', method: 'GET', body: null, headers: {} },
      { ...OPTIONS, followRedirects: false, session: aSession() },
    );

    expect(response).toMatchObject({
      status: 302,
      redirectedTo: 'https://x.example/login.php',
      body: '',
    });
  });

  it('gives up on a site that redirects forever', async () => {
    const { fetch } = aNetwork({
      'https://x.example/loop': { status: 302, headers: [['location', '/loop']] },
    });

    await expect(
      createSiteClient({ fetch }).send(
        { url: 'https://x.example/loop', method: 'GET', body: null, headers: {} },
        { ...OPTIONS, session: aSession() },
      ),
    ).rejects.toThrow('The site redirected too many times');
  });

  it('reads a page in the site’s character set, preferring the one it declares', async () => {
    const { fetch } = aNetwork({
      'https://x.example/ru': { body: iconv.encode('Мир', 'windows-1251') },
      'https://x.example/declared': {
        body: iconv.encode('Мир', 'koi8-r'),
        headers: [['content-type', 'text/html; charset=koi8-r']],
      },
    });
    const client = createSiteClient({ fetch });

    expect(
      (
        await client.send(
          { url: 'https://x.example/ru', method: 'GET', body: null, headers: {} },
          { ...OPTIONS, encoding: 'windows-1251', session: aSession() },
        )
      ).body,
    ).toBe('Мир');
    expect(
      (
        await client.send(
          { url: 'https://x.example/declared', method: 'GET', body: null, headers: {} },
          { ...OPTIONS, encoding: 'klingon', session: aSession() },
        )
      ).body,
    ).toBe('Мир');
  });

  it('says so when a site cannot be reached, or takes too long', async () => {
    const client = createSiteClient({ fetch: aNetwork({}).fetch });

    await expect(
      client.send(
        { url: 'https://x.example/', method: 'GET', body: null, headers: {} },
        { ...OPTIONS, session: aSession() },
      ),
    ).rejects.toThrow('The site could not be reached');

    const slow = createSiteClient({
      fetch: () => Promise.reject(new DOMException('timed out', 'TimeoutError')),
    });

    await expect(
      slow.send(
        { url: 'https://x.example/', method: 'GET', body: null, headers: {} },
        { ...OPTIONS, timeoutSeconds: 10, session: aSession() },
      ),
    ).rejects.toThrow('The site did not answer within 10 seconds');
  });

  describe('behind Cloudflare', () => {
    const CHALLENGE: Reply = {
      status: 403,
      body: '<title>Just a moment...</title>',
      headers: [['server', 'cloudflare']],
    };

    const aGet = (url: string) => ({ url, method: 'GET' as const, body: null, headers: {} });

    /**
     * A browser that answers each request with the page given, in Windows-1252.
     *
     * @param pages - What each address shows.
     * @returns The solver.
     */
    const aSolver = (pages: Record<string, string>) => ({
      fetch: vi.fn<Solver['fetch']>((request) => {
        const page = pages[request.url];

        return page === undefined
          ? Promise.reject(new Error('NS_ERROR_NET_RESET'))
          : Promise.resolve({
              url: request.url,
              status: 200,
              headers: { 'content-type': 'text/html; charset=windows-1252' },
              bytes: iconv.encode(page, 'windows-1252'),
              cookies: { cf_clearance: 'xyz' },
              userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:152.0) Firefox/152.0',
            });
      }),
    });

    it('says there is nothing to get past it with where there is no browser', async () => {
      const { fetch } = aNetwork({ 'https://x.example/': CHALLENGE });

      await expect(
        createSiteClient({ fetch }).send(aGet('https://x.example/'), {
          ...OPTIONS,
          session: aSession(),
        }),
      ).rejects.toThrow('this service has no browser to get past it');
    });

    it('asks through the browser, keeping the cookies and browser it got past with', async () => {
      const { fetch } = aNetwork({ 'https://x.example/s': CHALLENGE });
      const solver = aSolver({ 'https://x.example/s': '<p>café</p>' });
      const session = aSession({ uid: '1' });

      const response = await createSiteClient({ fetch, solver }).send(
        { url: 'https://x.example/s', method: 'POST', body: 'q=dune', headers: {} },
        { ...OPTIONS, session },
      );

      expect(response).toMatchObject({
        status: 200,
        body: '<p>café</p>',
        contentType: 'text/html; charset=windows-1252',
        redirectedTo: null,
      });
      expect(session).toEqual({
        cookies: { uid: '1', cf_clearance: 'xyz' },
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:152.0) Firefox/152.0',
      });
      expect(solver.fetch).toHaveBeenCalledWith(
        { url: 'https://x.example/s', method: 'POST', body: 'q=dune', headers: {} },
        { uid: '1' },
        expect.any(String),
      );
    });

    it('names each session to the browser the same way every time, and no two alike', async () => {
      const { fetch } = aNetwork({ 'https://x.example/s': [CHALLENGE, CHALLENGE, CHALLENGE] });
      const solver = aSolver({ 'https://x.example/s': '<p>one</p>' });
      const client = createSiteClient({ fetch, solver });
      const mine = aSession();
      const theirs = aSession();

      await client.send(aGet('https://x.example/s'), { ...OPTIONS, session: mine });
      await client.send(aGet('https://x.example/s'), { ...OPTIONS, session: mine });
      await client.send(aGet('https://x.example/s'), { ...OPTIONS, session: theirs });

      const named = solver.fetch.mock.calls.map((call) => call[2]);

      expect(named[0]).toBe(named[1]);
      expect(named[2]).not.toBe(named[0]);
    });

    it('sends the site’s next requests straight to the browser', async () => {
      const { fetch, asked } = aNetwork({ 'https://x.example/s': CHALLENGE });
      const solver = aSolver({
        'https://x.example/s': '<p>one</p>',
        'https://x.example/t': '<p>two</p>',
      });
      const client = createSiteClient({ fetch, solver });

      await client.send(aGet('https://x.example/s'), { ...OPTIONS, session: aSession() });
      const second = await client.send(aGet('https://x.example/t'), {
        ...OPTIONS,
        session: aSession(),
      });

      expect(second.body).toBe('<p>two</p>');
      expect(asked.map(({ url }) => url)).toEqual(['https://x.example/s']);
    });

    it('asks the site itself for what must not be followed', async () => {
      const { fetch } = aNetwork({
        'https://x.example/s': CHALLENGE,
        'https://x.example/get': { status: 302, headers: [['location', 'magnet:?xt=a']] },
      });
      const client = createSiteClient({
        fetch,
        solver: aSolver({ 'https://x.example/s': '<p>one</p>' }),
      });

      await client.send(aGet('https://x.example/s'), { ...OPTIONS, session: aSession() });

      const magnet = await client.send(aGet('https://x.example/get'), {
        ...OPTIONS,
        followRedirects: false,
        session: aSession(),
      });

      expect(magnet.redirectedTo).toBe('magnet:?xt=a');
    });

    it('says why the browser failed, and asks the site itself again next time', async () => {
      const { fetch } = aNetwork({
        'https://x.example/s': CHALLENGE,
        'https://x.example/u': [CHALLENGE, { status: 200, body: 'fine' }],
      });
      const solver = aSolver({ 'https://x.example/s': '<p>one</p>' });
      const client = createSiteClient({ fetch, solver });

      await client.send(aGet('https://x.example/s'), { ...OPTIONS, session: aSession() });

      solver.fetch.mockRejectedValueOnce(
        new IndexerFailure('The site’s browser check would not let the request through'),
      );

      await expect(
        client.send(aGet('https://x.example/u'), { ...OPTIONS, session: aSession() }),
      ).rejects.toThrow('would not let the request through');
      await expect(
        client.send(aGet('https://x.example/u'), { ...OPTIONS, session: aSession() }),
      ).rejects.toThrow('The browser that gets past Cloudflare’s check could not be started');
    });
  });
});
