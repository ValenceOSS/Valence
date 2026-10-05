import { createMiddleware } from 'hono/factory';
import { refuse } from '@ValenceI18n/refuse';
import { DEMO_BLOCKS } from '@ValenceServer/demo/DEMO_BLOCKS';
import type { Hono } from 'hono';

/**
 * Turns a shared demo account away from everything that would spoil the demo for the next visitor:
 * listing or signing out the devices other visitors are using, adding or removing profiles and
 * renaming or setting up the household again.
 * Handing out share links is withheld as a permission instead, so it is refused where it is checked.
 *
 * @param app - The application to guard, before its routes are registered.
 * @param isOnTheDemo - Whether a request comes from a demo account.
 */
const blockOnTheDemo = (
  app: Pick<Hono, 'on'>,
  isOnTheDemo: (headers: Headers) => Promise<boolean>,
): void => {
  const block = createMiddleware(async (context, next) => {
    if (await isOnTheDemo(context.req.raw.headers)) {
      return context.json(refuse('error.account.theDemoAccountCannotDoThat'), 403);
    }

    await next();

    return undefined;
  });

  for (const { method, path } of DEMO_BLOCKS) {
    app.on(method, path, block);
  }
};

export { blockOnTheDemo };
