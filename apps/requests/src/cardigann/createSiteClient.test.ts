import iconv from 'iconv-lite';
import { describe, expect, it, vi } from 'vitest';
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

    it('says FlareSolverr is needed where none is set up', async () => {
      const { fetch } = aNetwork({ 'https://x.example/': CHALLENGE });

      await expect(
        createSiteClient({ fetch }).send(
          { url: 'https://x.example/', method: 'GET', body: null, headers: {} },
          { ...OPTIONS, session: aSession() },
        ),
      ).rejects.toThrow('Set FLARESOLVERR_URL');
    });

    it('asks FlareSolverr, and keeps the cookies and browser it solved with', async () => {
      const { fetch, asked } = aNetwork({
        'https://x.example/s': CHALLENGE,
        'http://flaresolverr:8191/v1': {
          body: JSON.stringify({
            status: 'ok',
            solution: {
              url: 'https://x.example/s',
              status: 200,
              response: '<p>results</p>',
              cookies: [{ name: 'cf_clearance', value: 'xyz' }],
              userAgent: 'Solver/1.0',
            },
          }),
        },
      });
      const session = aSession({ uid: '1' });
      const response = await createSiteClient({
        fetch,
        flareSolverrUrl: 'http://flaresolverr:8191/',
      }).send(
        { url: 'https://x.example/s', method: 'POST', body: 'q=dune', headers: {} },
        { ...OPTIONS, session },
      );

      expect(response).toMatchObject({ status: 200, body: '<p>results</p>' });
      expect(session).toEqual({
        cookies: { uid: '1', cf_clearance: 'xyz' },
        userAgent: 'Solver/1.0',
      });
      expect(JSON.parse(String(asked[1]?.init.body))).toMatchObject({
        cmd: 'request.post',
        postData: 'q=dune',
        cookies: [{ name: 'uid', value: '1' }],
      });
    });

    it('says why FlareSolverr could not get past it', async () => {
      const { fetch } = aNetwork({
        'https://x.example/': CHALLENGE,
        'http://flaresolverr:8191/v1': {
          body: JSON.stringify({ status: 'error', message: 'Challenge not solved' }),
        },
      });

      await expect(
        createSiteClient({ fetch, flareSolverrUrl: 'http://flaresolverr:8191' }).send(
          { url: 'https://x.example/', method: 'GET', body: null, headers: {} },
          { ...OPTIONS, session: aSession() },
        ),
      ).rejects.toThrow(
        'FlareSolverr could not get past the site’s browser check: Challenge not solved',
      );
    });

    it('says so when FlareSolverr answers nonsense, or cannot be reached', async () => {
      const nonsense = aNetwork({
        'https://x.example/': CHALLENGE,
        'http://flaresolverr:8191/v1': { body: 'nope' },
      });

      await expect(
        createSiteClient({
          fetch: nonsense.fetch,
          flareSolverrUrl: 'http://flaresolverr:8191',
        }).send(
          { url: 'https://x.example/', method: 'GET', body: null, headers: {} },
          { ...OPTIONS, session: aSession() },
        ),
      ).rejects.toThrow('FlareSolverr could not get past the site’s browser check');

      const gone = aNetwork({ 'https://x.example/': CHALLENGE });

      await expect(
        createSiteClient({ fetch: gone.fetch, flareSolverrUrl: 'http://flaresolverr:8191' }).send(
          { url: 'https://x.example/', method: 'GET', body: null, headers: {} },
          { ...OPTIONS, session: aSession() },
        ),
      ).rejects.toThrow('FlareSolverr could not be reached');
    });
  });
});
