import { describe, expect, it, vi } from 'vitest';
import { createCardigannIndexer } from './createCardigannIndexer';
import { createSiteClient } from './createSiteClient';
import { readDefinition } from './readDefinition';
import type { SiteFetch } from './createSiteClient';
import type { IndexerSettings } from './IndexerSettings';
import type { SiteSession } from './SiteSession';

type Page = { status?: number; body?: string | Uint8Array; headers?: [string, string][] };

type Site = (url: URL, init: Parameters<SiteFetch>[1]) => Page | undefined;

const INDEXER = { id: '0f8fad5b-d9cb-469f-a165-70867728950e', name: 'Example' };

const RESULTS = `<table>
  <tr class="t"><td><a class="title" href="/t/1">Dune 2021 1080p</a></td><td><a class="dl" href="/dl/1.torrent">get</a></td><td class="s">2 GB</td></tr>
</table>`;

const TORRENT = new Uint8Array([0x64, 0x34, 0x3a, 0x69, 0x6e, 0x66, 0x6f, 0x65]);

/**
 * Stands up a site answering from the handler given, and an indexer for the definition against it.
 */
const standUp = (
  yaml: string,
  site: Site,
  settings: IndexerSettings = {},
  session: SiteSession = { cookies: {}, userAgent: null },
) => {
  const asked: {
    url: string;
    method: string;
    body: string | undefined;
    cookie: string | undefined;
  }[] = [];
  const fetch = vi.fn<SiteFetch>((url, init) => {
    asked.push({ url, method: init.method, body: init.body, cookie: init.headers['cookie'] });

    const page = site(new URL(url), init);

    if (page === undefined) {
      return Promise.resolve(new Response('not found', { status: 404 }));
    }

    const headers = new Headers(
      typeof page.body === 'string' ? { 'content-type': 'text/html; charset=utf-8' } : {},
    );

    for (const [name, value] of page.headers ?? []) {
      headers.set(name, value);
    }

    return Promise.resolve(new Response(page.body ?? '', { status: page.status ?? 200, headers }));
  });
  const definition = readDefinition(`id: example
name: Example
type: public
links: [https://site.example/]
caps:
  categorymappings:
    - {id: 1, cat: Movies, desc: "Films"}
  modes:
    search: [q]
${yaml}`);

  if (definition === null) {
    throw new Error('The test definition does not read.');
  }

  const sleep = vi.fn(() => Promise.resolve());
  const engine = createCardigannIndexer({
    definition,
    settings,
    siteLink: 'https://site.example/',
    session,
    client: createSiteClient({ fetch }),
    indexer: INDEXER,
    timeoutSeconds: 30,
    now: () => Date.parse('2026-09-19T12:00:00.000Z'),
    sleep,
  });

  return { engine, asked, session, sleep };
};

const SEARCH = `search:
  paths:
    - path: browse.php
  inputs:
    q: "{{ .Keywords }}"
  rows:
    selector: tr.t
  fields:
    title:
      selector: a.title
    details:
      selector: a.title
      attribute: href
    download:
      selector: a.dl
      attribute: href
    size:
      selector: td.s
`;

describe('createCardigannIndexer', () => {
  describe('searching', () => {
    it('searches a public site and reads what it found', async () => {
      const { engine, asked } = standUp(SEARCH, (url) =>
        url.pathname === '/browse.php' ? { body: RESULTS } : undefined,
      );

      expect(await engine.search({ query: 'dune' }, [])).toEqual([
        expect.objectContaining({
          title: 'Dune 2021 1080p',
          downloadUrl: 'https://site.example/dl/1.torrent',
        }),
      ]);
      expect(asked.map((one) => one.url)).toEqual(['https://site.example/browse.php?q=dune']);
    });

    it('says so when the search is sent somewhere else, or refused', async () => {
      const moved = standUp(SEARCH, () => ({
        status: 302,
        headers: [['location', 'https://elsewhere.example/']],
      }));

      await expect(moved.engine.search({ query: 'dune' }, [])).rejects.toThrow(
        'The site sent the search somewhere else: https://elsewhere.example/',
      );

      const broken = standUp(SEARCH, () => ({ status: 500 }));

      await expect(broken.engine.search({ query: 'dune' }, [])).rejects.toThrow(
        'The site answered 500',
      );
    });

    it('waits between requests where the definition asks it to', async () => {
      const { engine, sleep } = standUp(
        `requestDelay: 2\n${SEARCH.replace('    - path: browse.php', '    - path: browse.php\n    - path: other.php')}`,
        () => ({ body: RESULTS }),
      );

      await engine.search({ query: 'dune' }, []);

      expect(sleep).toHaveBeenCalledWith(2000);
    });
  });

  describe('logging in with a post', () => {
    const LOGIN = `login:
  method: post
  path: takelogin.php
  inputs:
    username: "{{ .Config.username }}"
    password: "{{ .Config.password }}"
  error:
    - selector: div.error
  test:
    path: browse.php
    selector: a[href="logout.php"]
${SEARCH}`;

    /**
     * A site that lets ada in, and shows results only to a session with its cookie.
     */
    const site: Site = (url, init) => {
      const isIn = init.headers['cookie']?.includes('sid=ok') === true;

      if (url.pathname === '/takelogin.php') {
        return init.body?.includes('password=right') === true
          ? {
              status: 302,
              headers: [
                ['location', '/index.php'],
                ['set-cookie', 'sid=ok'],
              ],
            }
          : { body: '<div class="error">Wrong password</div>' };
      }

      if (url.pathname === '/index.php') {
        return { body: 'home' };
      }

      if (url.pathname === '/browse.php') {
        return isIn
          ? { body: `<a href="logout.php">out</a>${RESULTS}` }
          : { status: 302, headers: [['location', '/login.php']] };
      }

      return undefined;
    };

    it('logs in first, then searches, keeping the session for next time', async () => {
      const { engine, asked, session } = standUp(LOGIN, site, {
        username: 'ada',
        password: 'right',
      });

      expect(await engine.search({ query: 'dune' }, [])).toHaveLength(1);
      expect(session.cookies).toEqual({ sid: 'ok' });
      expect(asked[0]).toMatchObject({ method: 'POST', body: 'username=ada&password=right' });

      asked.length = 0;
      await engine.search({ query: 'dune' }, []);

      expect(asked.map((one) => new URL(one.url).pathname)).toEqual(['/browse.php']);
    });

    it('logs in again where a kept session has run out', async () => {
      const { engine, asked } = standUp(
        LOGIN,
        site,
        { username: 'ada', password: 'right' },
        { cookies: { sid: 'stale' }, userAgent: null },
      );

      expect(await engine.search({ query: 'dune' }, [])).toHaveLength(1);
      expect(asked.map((one) => new URL(one.url).pathname)).toEqual([
        '/browse.php',
        '/takelogin.php',
        '/index.php',
        '/browse.php',
        '/browse.php',
      ]);
    });

    it('says what the site said when it refuses the login', async () => {
      const { engine } = standUp(LOGIN, site, { username: 'ada', password: 'wrong' });

      await expect(engine.search({ query: 'dune' }, [])).rejects.toThrow(
        'The site refused the login: Wrong password',
      );
    });

    it('says the settings are wrong where logging in does not stick', async () => {
      const forgetful: Site = (url) =>
        url.pathname === '/takelogin.php'
          ? { body: 'ok' }
          : url.pathname === '/browse.php'
            ? { body: 'please log in' }
            : undefined;
      const { engine } = standUp(LOGIN, forgetful, { username: 'ada', password: 'right' });

      await expect(engine.search({ query: 'dune' }, [])).rejects.toThrow(
        'Logging in to the site did not work',
      );
    });

    it('says so where the site asks to log in again after logging in', async () => {
      const stubborn: Site = (url) =>
        url.pathname === '/takelogin.php'
          ? { headers: [['set-cookie', 'sid=ok']] }
          : { status: 403 };
      const noTest = LOGIN.replace(
        / {2}test:\n {4}path: browse.php\n {4}selector: a\[href="logout.php"\]\n/,
        '',
      );
      const { engine, asked } = standUp(
        noTest,
        stubborn,
        {},
        { cookies: { sid: 'x' }, userAgent: null },
      );

      await expect(engine.search({ query: 'dune' }, [])).rejects.toThrow(
        'The site still asks to log in after logging in',
      );
      expect(asked.map((one) => new URL(one.url).pathname)).toEqual([
        '/browse.php',
        '/takelogin.php',
        '/browse.php',
      ]);
    });

    it('says the login was refused on a 401', async () => {
      const { engine } = standUp(LOGIN, (url) =>
        url.pathname === '/takelogin.php' ? { status: 401 } : undefined,
      );

      await expect(engine.login()).rejects.toThrow(
        'The site refused the login. Check the username, password or cookie.',
      );
    });

    it('uses an error block’s own message where it has one', async () => {
      const withMessage = LOGIN.replace(
        '    - selector: div.error',
        '    - selector: div.error\n      message:\n        selector: div.error\n        attribute: data-why',
      );
      const { engine } = standUp(withMessage, (url) =>
        url.pathname === '/takelogin.php'
          ? { body: '<div class="error" data-why="Banned">x</div>' }
          : undefined,
      );

      await expect(engine.login()).rejects.toThrow('The site refused the login: Banned');
    });

    it('starts from the cookies the definition names', async () => {
      const { engine, asked } = standUp(
        LOGIN.replace('  method: post', '  method: post\n  cookies: ["lang=en"]'),
        site,
        { username: 'ada', password: 'right' },
      );

      await engine.login();

      expect(asked[0]?.cookie).toBe('lang=en');
    });
  });

  describe('other ways of logging in', () => {
    it('takes a pasted cookie as the session', async () => {
      const { engine, asked } = standUp(
        `settings:\n  - {name: cookie, type: text, label: Cookie}\nlogin:\n  method: cookie\n  inputs:\n    cookie: "{{ .Config.cookie }}"\n${SEARCH}`,
        (url, init) =>
          url.pathname === '/browse.php' && init.headers['cookie'] === 'uid=1; pass=x'
            ? { body: RESULTS }
            : undefined,
        { cookie: 'uid=1; pass=x' },
      );

      expect(await engine.search({ query: 'dune' }, [])).toHaveLength(1);
      expect(asked).toHaveLength(1);
    });

    it('reads the cookie through the template where the setting has another name', async () => {
      const { engine, session } = standUp(
        `settings:\n  - {name: sess, type: text, label: Session}\nlogin:\n  method: cookie\n  inputs:\n    cookie: "sid={{ .Config.sess }}"\n${SEARCH}`,
        () => ({ body: RESULTS }),
        { sess: 'abc' },
      );

      await engine.login();

      expect(session.cookies).toEqual({ sid: 'abc' });
    });

    it('logs in with a get, and with one address', async () => {
      const get = standUp(
        `login:\n  method: get\n  path: login.php?x=1\n  inputs:\n    user: "{{ .Config.username }}"\n${SEARCH}`,
        (url) => (url.pathname === '/login.php' ? { headers: [['set-cookie', 's=1']] } : undefined),
        { username: 'ada' },
      );

      await get.engine.login();

      expect(get.asked[0]?.url).toBe('https://site.example/login.php?x=1&user=ada');

      const oneUrl = standUp(
        `settings:\n  - {name: key, type: text, label: Key}\nlogin:\n  method: oneurl\n  path: "rss/"\n  inputs:\n    oneurl: "{{ .Config.key }}"\n${SEARCH}`,
        () => ({ body: 'ok' }),
        { key: 'passkey123' },
      );

      await oneUrl.engine.login();

      expect(oneUrl.asked[0]?.url).toBe('https://site.example/rss/passkey123');
    });

    it('refuses a way of logging in it does not know', async () => {
      const { engine } = standUp(`login:\n  method: telepathy\n${SEARCH}`, () => ({ body: '' }));

      await expect(engine.login()).rejects.toThrow(
        'The definition logs in with telepathy, which Valence cannot do',
      );
    });

    it('does nothing to log in to a site with no login', async () => {
      const { engine, asked } = standUp(SEARCH, () => ({ body: '' }));

      await engine.login();

      expect(asked).toEqual([]);
    });
  });

  describe('logging in with a form', () => {
    const FORM = `login:
  method: form
  path: login.php
  form: form#login
  captcha:
    type: image
    selector: img.captcha
    input: code
  inputs:
    username: "{{ .Config.username }}"
    password: "{{ .Config.password }}"
  selectorinputs:
    token:
      selector: script:contains("token")
      filters:
        - name: regexp
          args: 'token: "(\\w+)"'
    maybe:
      selector: span.absent
      optional: true
  getselectorinputs:
    c:
      selector: meta[name="c"]
      attribute: content
    skipped:
      selector: span.absent
      optional: true
  error:
    - selector: p.error
${SEARCH}`;

    const LOGIN_PAGE = `<form id="login" action="takelogin.php">
  <input name="username"><input name="password" type="password">
  <input name="keep" type="checkbox" value="1" checked><input name="remember" type="checkbox" value="1">
  <input name="old" value="x" disabled><input value="nameless">
</form>
<img class="captcha" src="/captcha.php?id=5">
<meta name="c" content="99">
<script>var cfg = { token: "t0k3n" };</script>`;

    /**
     * A site with a login form and a captcha.
     */
    const site: Site = (url) => {
      if (url.pathname === '/login.php') {
        return { body: LOGIN_PAGE, headers: [['set-cookie', 'pre=1']] };
      }

      if (url.pathname === '/captcha.php') {
        return { body: new Uint8Array([1, 2, 3]), headers: [['content-type', 'image/png']] };
      }

      if (url.pathname === '/takelogin.php') {
        return { headers: [['set-cookie', 'sid=ok']] };
      }

      return url.pathname === '/browse.php' ? { body: RESULTS } : undefined;
    };

    it('fills in the form, its hidden values and the captcha, and posts it where it points', async () => {
      const { engine, asked, session } = standUp(FORM, site, {
        username: 'ada',
        password: 'pw',
        CAPTCHA: ' abc ',
      });

      await engine.login();

      const posted = asked.find((one) => one.method === 'POST');

      expect(posted?.url).toBe('https://site.example/takelogin.php?c=99');
      expect(new URLSearchParams(posted?.body)).toEqual(
        new URLSearchParams('username=ada&password=pw&keep=1&token=t0k3n&code=abc'),
      );
      expect(posted?.cookie).toBe('pre=1');
      expect(session.cookies).toEqual({ pre: '1', sid: 'ok' });
    });

    it('shows the captcha, keeping the session it belongs to', async () => {
      const { engine, session } = standUp(FORM, site);

      expect(await engine.captcha()).toEqual({ image: 'data:image/png;base64,AQID' });
      expect(session.cookies).toEqual({ pre: '1' });
    });

    it('has no captcha to show for a site without one', async () => {
      const { engine } = standUp(SEARCH, site);

      expect(await engine.captcha()).toBeNull();

      const noImage = standUp(FORM, (url) =>
        url.pathname === '/login.php' ? { body: '<form id="login"></form>' } : undefined,
      );

      expect(await noImage.engine.captcha()).toBeNull();
    });

    it('finds inputs by selector where the definition says names change', async () => {
      const { engine, asked } = standUp(
        FORM.replace('  form: form#login', '  form: form#login\n  selectors: true')
          .replace(
            '    username: "{{ .Config.username }}"\n    password: "{{ .Config.password }}"',
            '    input[type="password"]: "{{ .Config.password }}"',
          )
          .replace('    input: code', '    input: input[name="username"]'),
        site,
        { password: 'pw', CAPTCHA: 'abc' },
      );

      await engine.login();

      expect(
        new URLSearchParams(asked.find((one) => one.method === 'POST')?.body).get('password'),
      ).toBe('pw');
      expect(
        new URLSearchParams(asked.find((one) => one.method === 'POST')?.body).get('username'),
      ).toBe('abc');
    });

    it('says so where an input selector finds nothing, or there is no form', async () => {
      const missing = standUp(
        FORM.replace('  form: form#login', '  form: form#login\n  selectors: true'),
        site,
      );

      await expect(missing.engine.login()).rejects.toThrow(
        'The site’s login form has no input matching username',
      );

      const formless = standUp(FORM, (url) =>
        url.pathname === '/login.php' ? { body: '<p>down</p>' } : undefined,
      );

      await expect(formless.engine.login()).rejects.toThrow(
        'The site’s login page has no form matching form#login',
      );
    });

    it('posts a multipart form as one', async () => {
      const multipart: Site = (url) =>
        url.pathname === '/login.php'
          ? {
              body: '<form enctype="multipart/form-data" action="/in"><input name="a" value="1"></form>',
            }
          : { body: 'ok' };
      const { engine, asked } = standUp(
        `login:\n  method: form\n  path: login.php\n${SEARCH}`,
        multipart,
      );

      await engine.login();

      expect(asked[1]?.body).toMatch(
        /^------valence\d+\r\nContent-Disposition: form-data; name="a"\r\n\r\n1\r\n------valence\d+--$/,
      );
    });
  });

  describe('downloading', () => {
    it('hands a magnet link straight back', async () => {
      const { engine, asked } = standUp(SEARCH, () => undefined);

      expect(await engine.download('magnet:?xt=urn:btih:ABC')).toEqual({
        kind: 'magnet',
        url: 'magnet:?xt=urn:btih:ABC',
      });
      expect(asked).toEqual([]);
    });

    it('fetches a torrent with the session, following a redirect to it', async () => {
      const { engine } = standUp(SEARCH, (url) =>
        url.pathname === '/dl/1'
          ? { status: 302, headers: [['location', '/files/1.torrent']] }
          : url.pathname === '/files/1.torrent'
            ? { body: TORRENT }
            : undefined,
      );

      expect(await engine.download('https://site.example/dl/1')).toEqual({
        kind: 'torrent',
        bytes: TORRENT,
      });
    });

    it('takes a redirect to a magnet link as the magnet link', async () => {
      const { engine } = standUp(SEARCH, () => ({
        status: 302,
        headers: [['location', 'magnet:?xt=urn:btih:DEF']],
      }));

      expect(await engine.download('https://site.example/dl/2')).toEqual({
        kind: 'magnet',
        url: 'magnet:?xt=urn:btih:DEF',
      });
    });

    it('refuses what is not a torrent', async () => {
      const { engine } = standUp(SEARCH, () => ({ body: '<html>login</html>' }));

      await expect(engine.download('https://site.example/dl/3')).rejects.toThrow(
        'The site answered the download with something that is not a torrent',
      );
    });

    it('logs in first where the site needs it and there is no session', async () => {
      const { engine, asked } = standUp(
        `login:\n  method: post\n  path: in.php\n${SEARCH}`,
        (url) =>
          url.pathname === '/in.php' ? { headers: [['set-cookie', 's=1']] } : { body: TORRENT },
      );

      await engine.download('https://site.example/dl/1');

      expect(new URL(asked[0]?.url ?? '').pathname).toBe('/in.php');
    });

    it('follows the definition’s selectors to the torrent, skipping one that is not a torrent', async () => {
      const { engine } = standUp(
        `download:
  selectors:
    - selector: a.missing
      attribute: href
    - selector: a.broken
      attribute: href
    - selector: a.good
      attribute: href
${SEARCH}`,
        (url) => {
          if (url.pathname === '/details/1') {
            return {
              body: '<a class="broken" href="/bad">x</a><a class="good" href="/good">y</a>',
            };
          }

          return url.pathname === '/good' ? { body: TORRENT } : { body: 'nope' };
        },
      );

      expect(await engine.download('https://site.example/details/1')).toEqual({
        kind: 'torrent',
        bytes: TORRENT,
      });
    });

    it('takes a magnet link a selector finds, and says so where none gives a torrent', async () => {
      const selectors = `download:\n  selectors:\n    - selector: a.m\n      attribute: href\n${SEARCH}`;
      const magnet = standUp(selectors, () => ({
        body: '<a class="m" href="magnet:?xt=urn:btih:GHI">m</a>',
      }));

      expect(await magnet.engine.download('https://site.example/details/1')).toEqual({
        kind: 'magnet',
        url: 'magnet:?xt=urn:btih:GHI',
      });

      const nothing = standUp(selectors, () => ({ body: '<p></p>' }));

      await expect(nothing.engine.download('https://site.example/details/1')).rejects.toThrow(
        'None of the definition’s download links gave a torrent',
      );
    });

    it('does a before request first, reading its path from the page, and posts the download where told', async () => {
      const { engine, asked } = standUp(
        `download:
  method: post
  before:
    pathselector:
      selector: a.thanks
      attribute: href
    method: post
    queryseparator: ";"
    inputs:
      id: "{{ .DownloadUri.Query.id }}"
      thanks: 1
  selectors:
    - selector: a.dl
      attribute: href
      usebeforeresponse: true
${SEARCH}`,
        (url) => {
          if (url.pathname === '/details.php') {
            return { body: '<a class="thanks" href="/thanks.php">thanks</a>' };
          }

          if (url.pathname === '/thanks.php') {
            return { body: '<a class="dl" href="/get.php?id=7">get</a>' };
          }

          return url.pathname === '/get.php' ? { body: TORRENT } : undefined;
        },
      );

      expect(await engine.download('https://site.example/details.php?id=7')).toEqual({
        kind: 'torrent',
        bytes: TORRENT,
      });
      expect(asked.find((one) => one.url.endsWith('/thanks.php'))).toMatchObject({
        method: 'POST',
        body: 'id=7;thanks=1',
      });
      expect(asked.at(-1)).toMatchObject({
        method: 'POST',
        url: 'https://site.example/get.php?id=7',
      });
    });

    it('does a before request by path with a query', async () => {
      const { engine, asked } = standUp(
        `download:\n  before:\n    path: "thanks.php?x=1"\n    inputs:\n      id: "{{ .DownloadUri.Query.id }}"\n${SEARCH}`,
        (url) => (url.pathname === '/thanks.php' ? { body: '' } : { body: TORRENT }),
      );

      await engine.download('https://site.example/d.php?id=3');

      expect(asked[0]?.url).toBe('https://site.example/thanks.php?x=1&id=3');
    });

    it('builds a magnet link from the info hash the page gives', async () => {
      const infohash = `download:
  infohash:
    hash:
      selector: span.hash
    title:
      selector: h1
      filters:
        - name: trim
${SEARCH}`;
      const { engine } = standUp(infohash, () => ({
        body: '<h1> Dune </h1><span class="hash">ABC</span>',
      }));

      const fetched = await engine.download('https://site.example/t/1');

      expect(fetched.kind).toBe('magnet');
      expect(fetched.kind === 'magnet' ? fetched.url : '').toContain(
        'magnet:?xt=urn:btih:ABC&dn=Dune',
      );

      const missing = standUp(infohash, () => ({ body: '<p></p>' }));

      await expect(missing.engine.download('https://site.example/t/1')).rejects.toThrow(
        'The release’s page did not give its info hash',
      );
    });

    it('fetches without testing the torrent where the definition says not to', async () => {
      const { engine } = standUp(
        `testlinktorrent: false\ndownload:\n  selectors:\n    - selector: a\n      attribute: href\n${SEARCH}`,
        (url) =>
          url.pathname === '/details/1' ? { body: '<a href="/x">x</a>' } : { body: 'anything' },
      );

      expect((await engine.download('https://site.example/details/1')).kind).toBe('torrent');
    });
  });

  it('offers the definition’s categories', () => {
    const { engine } = standUp(SEARCH, () => undefined);

    expect(engine.categories.standard().map((category) => category.id)).toEqual([2000, 100_001]);
  });
});
