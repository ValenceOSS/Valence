import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { DEMO_BLOCKS } from '@ValenceServer/demo/DEMO_BLOCKS';
import { blockOnTheDemo } from './blockOnTheDemo';

const anApp = (isDemo: boolean) => {
  const app = new Hono();

  blockOnTheDemo(app, () => Promise.resolve(isDemo));
  app.all('/api/*', (context) => context.text('done'));

  return app;
};

const ask = (app: Hono, method: string, path: string) =>
  app.request(path.replace(':id', 'd1').replace(':profileId', 'p1'), { method });

describe('blockOnTheDemo', () => {
  it('turns the demo account away from everything it may not do', async () => {
    const app = anApp(true);

    for (const { method, path } of DEMO_BLOCKS) {
      const answer = await ask(app, method, path);

      expect(answer.status, `${method} ${path}`).toBe(403);
      expect(await answer.json()).toMatchObject({
        code: 'error.account.theDemoAccountCannotDoThat',
      });
    }
  });

  it('keeps the shared account’s name, picture, password and address as they are', async () => {
    const app = anApp(true);

    for (const [method, path] of [
      ['POST', '/api/auth/update-user'],
      ['POST', '/api/auth/change-password'],
      ['POST', '/api/auth/change-email'],
      ['POST', '/api/auth/delete-user'],
      ['PUT', '/api/account/photo'],
      ['DELETE', '/api/account/photo'],
      ['PUT', '/api/profiles/:profileId/photo'],
    ] as const) {
      expect((await ask(app, method, path)).status, `${method} ${path}`).toBe(403);
    }
  });

  it('lets every other account through', async () => {
    const app = anApp(false);

    for (const { method, path } of DEMO_BLOCKS) {
      expect((await ask(app, method, path)).status, `${method} ${path}`).toBe(200);
    }
  });

  it('lets the demo account change how its profile behaves, but not what it is called or looks like', async () => {
    const app = anApp(true);
    const changing = (body: object) =>
      app.request('/api/profiles/p1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });

    expect((await changing({ showsWhatIamWatching: false })).status).toBe(200);

    for (const fixed of [{ name: 'Mine now' }, { colour: '#ff0000' }, { avatar: 'cat' }]) {
      const answer = await changing({ showsWhatIamWatching: true, ...fixed });

      expect(answer.status, JSON.stringify(fixed)).toBe(403);
      expect(await answer.json()).toMatchObject({
        code: 'error.account.theDemoAccountCannotDoThat',
      });
    }

    expect(
      (
        await anApp(false).request('/api/profiles/p1', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: 'Mine' }),
        })
      ).status,
    ).toBe(200);
  });

  it('still lets the demo account read the household', async () => {
    const app = anApp(true);

    expect((await ask(app, 'GET', '/api/account')).status).toBe(200);
  });
});
