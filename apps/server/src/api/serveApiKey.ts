import {
  listApiKeysRoute,
  createApiKeyRoute,
  updateApiKeyRoute,
  revokeApiKeyRoute,
} from '@ValenceServer/routes/ApiKeyRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the api key endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveApiKey = (app: OpenAPIHono, context: AppContext): void => {
  const { permissions, apiKeys, readKeyHolder } = context;

  app.openapi(listApiKeysRoute, async (context) => {
    const holder = await readKeyHolder(context.req.raw.headers);

    if (holder.refusal !== null) {
      return holder.refusal === 'anonymous'
        ? context.json({ error: 'Nobody is signed in.' }, 401)
        : context.json({ error: 'This account may not hold API keys.' }, 403);
    }

    return context.json({ keys: await apiKeys.list(context.req.raw.headers) }, 200);
  });

  app.openapi(createApiKeyRoute, async (context) => {
    const holder = await readKeyHolder(context.req.raw.headers);

    if (holder.refusal !== null) {
      return holder.refusal === 'anonymous'
        ? context.json({ error: 'Nobody is signed in.' }, 401)
        : context.json({ error: 'This account may not hold API keys.' }, 403);
    }

    const account = holder.account;

    const { name, expiresInDays, permissions: asked, rateLimit } = context.req.valid('json');

    const held = await permissions.resolve(account.id);
    const restricted = asked === null ? null : asked.filter((one) => held.has(one));

    const made = await apiKeys.create(account.id, {
      name,
      expiresInDays,
      permissions: restricted,
      rateLimit,
    });

    return context.json(made, 201);
  });

  app.openapi(updateApiKeyRoute, async (context) => {
    const holder = await readKeyHolder(context.req.raw.headers);

    if (holder.refusal !== null) {
      return holder.refusal === 'anonymous'
        ? context.json({ error: 'Nobody is signed in.' }, 401)
        : context.json({ error: 'This account may not hold API keys.' }, 403);
    }

    const changed = await apiKeys.setEnabled(
      context.req.raw.headers,
      context.req.valid('param').id,
      context.req.valid('json').enabled,
    );

    if (changed === null) {
      return context.json({ error: 'No such key on this account.' }, 404);
    }

    return context.json(changed, 200);
  });

  app.openapi(revokeApiKeyRoute, async (context) => {
    const holder = await readKeyHolder(context.req.raw.headers);

    if (holder.refusal !== null) {
      return holder.refusal === 'anonymous'
        ? context.json({ error: 'Nobody is signed in.' }, 401)
        : context.json({ error: 'This account may not hold API keys.' }, 403);
    }

    if (!(await apiKeys.revoke(context.req.raw.headers, context.req.valid('param').id))) {
      return context.json({ error: 'No such key on this account.' }, 404);
    }

    return context.body(null, 204);
  });
};

export { serveApiKey };
