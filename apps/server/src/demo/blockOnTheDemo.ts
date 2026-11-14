import { createMiddleware } from 'hono/factory';
import { refuse } from '@ValenceI18n/refuse';
import { DEMO_BLOCKS } from '@ValenceServer/demo/DEMO_BLOCKS';
import { DEMO_FIXED_PROFILE_FIELDS } from '@ValenceServer/demo/DEMO_FIXED_PROFILE_FIELDS';
import { z } from 'zod';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { Hono } from 'hono';

/**
 * Turns a shared demo account away from everything that would spoil the demo for the next visitor:
 * seeing or signing out the devices visitors are signed in on, setting up two-step sign-in, a
 * passkey or a password that would lock the next visitor out, adding or removing profiles, renaming
 * the account or giving a profile another name, colour or picture, and setting up the household
 * again. A profile's own settings stay open, so a visitor can try them. Handing out share links is
 * withheld as a permission instead, so it is refused where it is checked.
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

  const keepTheProfileAsItIs = createMiddleware(async (context, next) => {
    const asked = z
      .record(z.string(), JsonValueSchema)
      .safeParse(await context.req.json().catch(() => null));

    if (
      asked.success &&
      Object.keys(asked.data).some((field) => DEMO_FIXED_PROFILE_FIELDS.includes(field)) &&
      (await isOnTheDemo(context.req.raw.headers))
    ) {
      return context.json(refuse('error.account.theDemoAccountCannotDoThat'), 403);
    }

    await next();

    return undefined;
  });

  for (const { method, path } of DEMO_BLOCKS) {
    app.on(method, path, block);
  }

  app.on('PATCH', '/api/profiles/:profileId', keepTheProfileAsItIs);
};

export { blockOnTheDemo };
