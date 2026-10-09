import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { serveTheTvLayout } from './serveTheTvLayout';

const LG =
  'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36';

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

  it('chooses the layout an address asks for, and keeps it', async () => {
    const app = aServer();
    const toTv = await app.request('/?layout=tv', {
      headers: { 'user-agent': LG_2025, cookie: 'valence-layout=web' },
    });

    expect(await toTv.text()).toContain('the tv layout');
    expect(toTv.headers.get('set-cookie')).toContain('valence-layout=tv');

    const toWeb = await app.request('/?layout=web', { headers: { 'user-agent': LG_2025 } });

    expect(await toWeb.text()).toBe('the web app');
    expect(toWeb.headers.get('set-cookie')).toContain('valence-layout=web');
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
