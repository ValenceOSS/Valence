import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { offerTheIphoneApp } from './offerTheIphoneApp';

const PAGE = '<html><head></head><body></body></html>';

/**
 * A server that answers its pages and an API with the banner offered.
 *
 * @param appStoreId - The listing, or empty for none.
 * @returns The server.
 */
const aServer = (appStoreId: string) => {
  const app = new Hono();

  app.use('*', offerTheIphoneApp(appStoreId));
  app.get('/api/health', (context) => context.json({ ok: true }));
  app.get('*', (context) => context.html(PAGE));

  return app;
};

describe('offerTheIphoneApp', () => {
  it('offers the app on a page, opening it at this server as the browser reached it', async () => {
    const answer = await aServer('6815748526').request('http://valence:8420/films', {
      headers: { 'x-forwarded-proto': 'https', 'x-forwarded-host': 'tv.example.com' },
    });

    expect(await answer.text()).toContain(
      '<meta name="apple-itunes-app" content="app-id=6815748526, app-argument=valence://open?server=https%3A%2F%2Ftv.example.com">',
    );
  });

  it('opens the app at the television being signed in, on the page that approves it', async () => {
    const answer = await aServer('1').request('http://valence:8420/device?user_code=ab-cd');

    expect(await answer.text()).toContain(
      'app-argument=valence://device?user_code=ABCD&amp;server=http%3A%2F%2Fvalence%3A8420',
    );
  });

  it('offers nothing where no listing is set', async () => {
    const answer = await aServer('').request('http://valence:8420/films');

    expect(await answer.text()).toBe(PAGE);
  });

  it('leaves answers that are not pages alone', async () => {
    const answer = await aServer('1').request('http://valence:8420/api/health');

    expect(await answer.json()).toEqual({ ok: true });
  });
});
