import {
  listApiKeysRoute,
  createApiKeyRoute,
  updateApiKeyRoute,
  revokeApiKeyRoute,
} from '@ValenceServer/routes/ApiKeyRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';

/**
 * Registers the api key endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveApiKey = (app: OpenAPIHono, context: AppContext): void => {
  const { permissions, apiKeys, readKeyHolder, readActing, chosenProfiles, recordAudit } = context;

  app.openapi(listApiKeysRoute, async (context) => {
    const holder = await readKeyHolder(context.req.raw.headers);

    if (holder.refusal !== null) {
      return holder.refusal === 'anonymous'
        ? context.json(refuse('error.common.nobodyIsSignedIn'), 401)
        : context.json(refuse('error.apiKey.thisAccountMayNotHoldAPI'), 403);
    }

    return context.json({ keys: await apiKeys.list(context.req.raw.headers) }, 200);
  });

  app.openapi(createApiKeyRoute, async (context) => {
    const holder = await readKeyHolder(context.req.raw.headers);

    if (holder.refusal !== null) {
      return holder.refusal === 'anonymous'
        ? context.json(refuse('error.common.nobodyIsSignedIn'), 401)
        : context.json(refuse('error.apiKey.thisAccountMayNotHoldAPI'), 403);
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
    const profileId = (await readActing(context.req.raw.headers))?.profile?.id;

    if (profileId !== undefined) {
      await chosenProfiles.tieKey(made.id, profileId);
    }

    await recordAudit(context, 'account.keyCreated', name);

    return context.json(made, 201);
  });

  app.openapi(updateApiKeyRoute, async (context) => {
    const holder = await readKeyHolder(context.req.raw.headers);

    if (holder.refusal !== null) {
      return holder.refusal === 'anonymous'
        ? context.json(refuse('error.common.nobodyIsSignedIn'), 401)
        : context.json(refuse('error.apiKey.thisAccountMayNotHoldAPI'), 403);
    }

    const changed = await apiKeys.setEnabled(
      context.req.raw.headers,
      context.req.valid('param').id,
      context.req.valid('json').enabled,
    );

    if (changed === null) {
      return context.json(refuse('error.apiKey.noSuchKeyOnThisAccount'), 404);
    }

    await recordAudit(context, 'account.keyChanged', changed.name, {
      enabled: context.req.valid('json').enabled ? 'true' : 'false',
    });

    return context.json(changed, 200);
  });

  app.openapi(revokeApiKeyRoute, async (context) => {
    const holder = await readKeyHolder(context.req.raw.headers);

    if (holder.refusal !== null) {
      return holder.refusal === 'anonymous'
        ? context.json(refuse('error.common.nobodyIsSignedIn'), 401)
        : context.json(refuse('error.apiKey.thisAccountMayNotHoldAPI'), 403);
    }

    const revoking = (await apiKeys.list(context.req.raw.headers)).find(
      (key) => key.id === context.req.valid('param').id,
    );

    if (!(await apiKeys.revoke(context.req.raw.headers, context.req.valid('param').id))) {
      return context.json(refuse('error.apiKey.noSuchKeyOnThisAccount'), 404);
    }

    await recordAudit(context, 'account.keyRevoked', revoking?.name ?? null);

    return context.body(null, 204);
  });
};

export { serveApiKey };
