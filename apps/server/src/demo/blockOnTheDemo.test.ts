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

  it('lets every other account through', async () => {
    const app = anApp(false);

    for (const { method, path } of DEMO_BLOCKS) {
      expect((await ask(app, method, path)).status, `${method} ${path}`).toBe(200);
    }
  });

  it('still lets the demo account read its devices and change its own profile', async () => {
    const app = anApp(true);

    expect((await ask(app, 'GET', '/api/account/devices')).status).toBe(200);
    expect((await ask(app, 'PATCH', '/api/profiles/p1')).status).toBe(200);
    expect((await ask(app, 'GET', '/api/account')).status).toBe(200);
  });
});
