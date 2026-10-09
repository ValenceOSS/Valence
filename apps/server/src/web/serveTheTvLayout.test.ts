import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { describe, expect, it } from 'vitest';
import { serveTheTvLayout } from './serveTheTvLayout';

const LG =
  'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36';

const LG_NEW =
  'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.270 Safari/537.36';

const LG_2025 =
  'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chr0me/120.0.6099.270 Safari/537.36';

/**
 * A server with a TV layout built into a folder of its own, and the web app behind it.
 *
 * @param isBuilt - Whether the TV layout was built.
 * @returns The server.
 */
const aServer = (isBuilt = true) => {
  const root = mkdtempSync(join(tmpdir(), 'valence-tv-layout-'));

  if (isBuilt) {
    writeFileSync(join(root, 'index.html'), '<p>the tv layout</p>');
    mkdirSync(join(root, '_expo'));
    writeFileSync(join(root, '_expo', 'app.js'), 'the tv code');
    writeFileSync(join(root, '_expo', 'app.js.br'), 'the tv code, compressed');
  }

  const app = new Hono();

  app.use('*', serveTheTvLayout(root));
  app.get('*', (context) => context.text('the web app'));

  return app;
};

describe('serveTheTvLayout', () => {
  it('shows a television’s browser the TV layout at the web app’s own addresses', async () => {
    const app = aServer();

    for (const path of ['/', '/films', '/?item=dune']) {
      const answer = await app.request(path, { headers: { 'user-agent': LG } });

      expect(await answer.text()).toContain('the tv layout');
      expect(answer.headers.get('vary')).toBe('User-Agent, Cookie');
    }
  });

  it('serves the TV layout’s own files from beneath /tv', async () => {
    const answer = await aServer().request('/tv/_expo/app.js');

    expect(await answer.text()).toBe('the tv code');
  });

  it('gives a television that chose the web app a way back that needs no web app to run', async () => {
    const app = new Hono();
    const tv = mkdtempSync(join(tmpdir(), 'valence-tv-layout-'));
    const web = mkdtempSync(join(process.cwd(), 'valence-web-app-'));

    writeFileSync(join(tv, 'index.html'), '<p>the tv layout</p>');
    writeFileSync(join(web, 'index.html'), '<body><div id="root"></div></body>');
    app.use('*', serveTheTvLayout(tv));
    app.use('/*', serveStatic({ root: relative(process.cwd(), web) }));

    try {
      const onTheTv = await app.request('/', {
        headers: { 'user-agent': LG_NEW, cookie: 'valence-layout=web' },
      });
      const page = await onTheTv.text();
      const onAComputer = await (
        await app.request('/', { headers: { cookie: 'valence-layout=web' } })
      ).text();

      expect(page).toContain('valence-layout=tv');
      expect(onTheTv.headers.get('content-type')).toContain('text/html');
      expect(onTheTv.headers.get('content-length') ?? String(Buffer.byteLength(page))).toBe(
        String(Buffer.byteLength(page)),
      );
      expect(onAComputer).not.toContain('<script>');
    } finally {
      rmSync(web, { recursive: true, force: true });
    }
  });

  it('sends the compressed copy of a file to a browser that takes it', async () => {
    const answer = await aServer().request('/tv/_expo/app.js', {
      headers: { 'accept-encoding': 'gzip, deflate, br' },
    });

    expect(answer.headers.get('content-encoding')).toBe('br');
    expect(await answer.text()).toBe('the tv code, compressed');
  });

  it('shows every other browser the web app, unless somebody chose the TV layout', async () => {
    const app = aServer();

    expect(await (await app.request('/')).text()).toBe('the web app');
    expect(
      await (await app.request('/', { headers: { cookie: 'valence-layout=tv' } })).text(),
    ).toContain('the tv layout');
    expect(
      await (
        await app.request('/', {
          headers: { 'user-agent': LG_2025, cookie: 'valence-layout=web' },
        })
      ).text(),
    ).toBe('the web app');
  });

  it('keeps a television too old for the web app on the TV layout, whatever was chosen', async () => {
    const answer = await aServer().request('/', {
      headers: { 'user-agent': LG, cookie: 'valence-layout=web' },
    });

    expect(await answer.text()).toContain('the tv layout');
  });

  it('chooses the layout an address asks for, keeps it, and sends the page on without asking', async () => {
    const app = aServer();
    const toTv = await app.request('/films?layout=tv&item=dune', {
      headers: { 'user-agent': LG_2025, cookie: 'valence-layout=web' },
    });

    expect(toTv.status).toBe(302);
    expect(toTv.headers.get('location')).toBe('/films?item=dune');
    expect(toTv.headers.get('set-cookie')).toContain('valence-layout=tv');

    const toWeb = await app.request('/?layout=web', { headers: { 'user-agent': LG_2025 } });

    expect(toWeb.headers.get('location')).toBe('/');
    expect(toWeb.headers.get('set-cookie')).toContain('valence-layout=web');
  });

  it('asks any browser that chose the web app from the TV layout to keep it, TV or not', async () => {
    const app = new Hono();
    const tv = mkdtempSync(join(tmpdir(), 'valence-tv-layout-'));

    writeFileSync(join(tv, 'index.html'), '<p>the tv layout</p>');
    app.use('*', serveTheTvLayout(tv));
    app.get('*', (context) => context.html('<body><div id="root"></div></body>'));

    const page = await (
      await app.request('/', {
        headers: { cookie: 'valence-layout=web; valence-layout-on-trial=1' },
      })
    ).text();

    expect(page).toContain('valenceLayoutTrial');
  });

  it('stops asking a television to keep the web app once somebody has kept it', async () => {
    const app = new Hono();
    const tv = mkdtempSync(join(tmpdir(), 'valence-tv-layout-'));

    writeFileSync(join(tv, 'index.html'), '<p>the tv layout</p>');
    app.use('*', serveTheTvLayout(tv));
    app.get('*', (context) => context.html('<body><div id="root"></div></body>'));

    const kept = await (
      await app.request('/', {
        headers: { 'user-agent': LG_NEW, cookie: 'valence-layout=web; valence-layout-kept=1' },
      })
    ).text();

    expect(kept).not.toContain('<script>');
  });

  it('forgets a kept web app when a layout is chosen by address', async () => {
    const answer = await aServer().request('/?layout=web', {
      headers: { 'user-agent': LG_NEW, cookie: 'valence-layout-kept=1' },
    });

    expect(answer.headers.getSetCookie().join(' ')).toMatch(/valence-layout-kept=;.*Max-Age=0/u);
  });

  it('follows the kept choice once the address no longer asks', async () => {
    const app = aServer();

    expect(
      await (
        await app.request('/', { headers: { 'user-agent': LG_2025, cookie: 'valence-layout=tv' } })
      ).text(),
    ).toContain('the tv layout');
  });

  it('leaves the API alone', async () => {
    const answer = await aServer().request('/api/health', { headers: { 'user-agent': LG } });

    expect(await answer.text()).toBe('the web app');
  });

  it('shows the web app to everybody where the TV layout was not built', async () => {
    const answer = await aServer(false).request('/', { headers: { 'user-agent': LG } });

    expect(await answer.text()).toBe('the web app');
  });
});
