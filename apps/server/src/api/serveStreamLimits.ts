import {
  readAccountStreamLimitRoute,
  readRoleStreamLimitRoute,
  setAccountStreamLimitRoute,
  setRoleStreamLimitRoute,
} from '@ValenceServer/routes/StreamLimitRoute';
import { readStreamLimit } from '@ValenceServer/streams/readStreamLimit';
import { streamsOf } from '@ValenceServer/streams/streamsOf';
import { NO_STREAM_LIMIT, StreamLimitsSchema } from '@ValenceContracts/schemas/StreamLimit';
import type { StreamLimit, StreamLimits } from '@ValenceContracts/schemas/StreamLimit';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';

const NOBODY_LIMITED: StreamLimits = { accounts: {}, roles: {} };

/**
 * Whether a limit holds anything back, so one set back to nothing is forgotten rather than kept as
 * an empty entry.
 *
 * @param limit - The limit.
 * @returns Whether either side of it is set.
 */
const holdsAnything = (limit: StreamLimit): boolean =>
  limit.maxBitrateKbps !== null || limit.maxStreams !== null;

/**
 * Registers the endpoints that limit how much an account, or everybody holding a role, may stream.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveStreamLimits = (app: OpenAPIHono, context: AppContext): void => {
  const { requires, settings, permissions, presence, readActor, refusalOver } = context;

  const limitsNow = async (): Promise<StreamLimits> =>
    StreamLimitsSchema.catch(NOBODY_LIMITED).parse((await settings.read()).streamLimits);

  const answerFor = async (userId: string) => {
    const limits = await limitsNow();
    const roles = await permissions.rolesFor(userId);

    return {
      own: limits.accounts[userId] ?? NO_STREAM_LIMIT,
      effective: readStreamLimit(
        limits,
        userId,
        roles.map((role) => role.id),
      ),
      streamsNow: streamsOf(presence.list(), userId),
    };
  };

  app.openapi(readAccountStreamLimitRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'account.manage'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    return context.json(await answerFor(context.req.valid('param').userId), 200);
  });

  app.openapi(setAccountStreamLimitRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.manage')) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const { userId } = context.req.valid('param');

    const refusal = await refusalOver(actor, userId);

    if (refusal !== null) {
      return context.json(refusal, 403);
    }
    const limit = context.req.valid('json');
    const limits = await limitsNow();
    const { [userId]: _was, ...others } = limits.accounts;

    await settings.write({
      streamLimits: {
        ...limits,
        accounts: holdsAnything(limit) ? { ...others, [userId]: limit } : others,
      },
    });

    return context.json(await answerFor(userId), 200);
  });

  app.openapi(readRoleStreamLimitRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'account.manage'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const limits = await limitsNow();

    return context.json(limits.roles[context.req.valid('param').roleId] ?? NO_STREAM_LIMIT, 200);
  });

  app.openapi(setRoleStreamLimitRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'account.manage'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const { roleId } = context.req.valid('param');
    const limit = context.req.valid('json');
    const limits = await limitsNow();
    const { [roleId]: _was, ...others } = limits.roles;

    await settings.write({
      streamLimits: {
        ...limits,
        roles: holdsAnything(limit) ? { ...others, [roleId]: limit } : others,
      },
    });

    return context.json(limit, 200);
  });
};

export { serveStreamLimits };
