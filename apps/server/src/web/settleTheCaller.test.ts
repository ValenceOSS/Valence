import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { CALLER_HEADER } from './CALLER_HEADER';
import { settleTheCaller } from './settleTheCaller';

/**
 * An application that answers with the caller's address as every later handler would read it.
 *
 * @param address - The address this server works out for every request.
 * @returns The application.
 */
const echoing = (address: string | null) => {
  const app = new Hono();

  app.use(
    '*',
    settleTheCaller(() => address),
  );
  app.post('/api/echo', (context) =>
    context.json({ caller: context.req.raw.headers.get(CALLER_HEADER) }),
  );

  return app;
};

describe('settleTheCaller', () => {
  it('replaces the address a caller wrote with the one this server worked out', async () => {
    const response = await echoing('203.0.113.7').request('http://valence.test/api/echo', {
      method: 'POST',
      headers: { [CALLER_HEADER]: '198.51.100.1' },
    });

    expect(await response.json()).toEqual({ caller: '203.0.113.7' });
  });

  it('removes the address a caller wrote where this server cannot tell one', async () => {
    const response = await echoing(null).request('http://valence.test/api/echo', {
      method: 'POST',
      headers: { [CALLER_HEADER]: '198.51.100.1' },
    });

    expect(await response.json()).toEqual({ caller: null });
  });

  it('leaves the body for the handler to read', async () => {
    const app = new Hono();

    app.use(
      '*',
      settleTheCaller(() => '203.0.113.7'),
    );
    app.post('/api/echo', async (context) => context.text(await context.req.text()));

    const response = await app.request('http://valence.test/api/echo', {
      method: 'POST',
      body: 'what was sent',
    });

    expect(await response.text()).toBe('what was sent');
  });
});
