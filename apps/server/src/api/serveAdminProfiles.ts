import { accountProfileRoutes } from '@ValenceServer/routes/ProfileManagementRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';

/**
 * Registers what an administrator may do to the profiles on anybody's account: everything the
 * account's own owner may, for anybody they outrank, including clearing a PIN somebody forgot.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveAdminProfiles = (app: OpenAPIHono, context: AppContext): void => {
  const { readActor, refusalOver, listUsers, profileManagement: management } = context;

  /**
   * Whether the person asking may manage the profiles on an account, and as whom.
   *
   * @param headers - The request's headers.
   * @param userId - Whose account.
   * @returns The administrator as a manager, or why not.
   */
  const asAdministrator = async (headers: Headers, userId: string) => {
    const actor = await readActor(headers);

    if (actor === null || !actor.permissions.has('account.profiles')) {
      return { refusal: refuse('common.thatIsForAdministrators'), status: 403 } as const;
    }

    if (management === undefined) {
      return { refusal: refuse('error.account.noSuchAccount'), status: 404 } as const;
    }

    if (((await listUsers?.()) ?? []).every((account) => account.id !== userId)) {
      return { refusal: refuse('error.account.noSuchAccount'), status: 404 } as const;
    }

    const refusal = await refusalOver(actor, userId);

    if (refusal !== null) {
      return { refusal, status: 403 } as const;
    }

    return {
      manager: { kind: 'administrator', accountId: userId, actorId: actor.id },
      management,
    } as const;
  };

  app.openapi(accountProfileRoutes.list, async (context) => {
    const { userId } = context.req.valid('param');
    const asked = await asAdministrator(context.req.raw.headers, userId);

    if ('refusal' in asked) {
      return context.json(asked.refusal, asked.status);
    }

    return context.json(await asked.management.list(userId, null), 200);
  });

  app.openapi(accountProfileRoutes.create, async (context) => {
    const asked = await asAdministrator(context.req.raw.headers, context.req.valid('param').userId);

    if ('refusal' in asked) {
      return context.json(asked.refusal, asked.status);
    }

    const { name, colour, avatar } = context.req.valid('json');
    const answer = await asked.management.create(asked.manager, {
      name,
      colour,
      ...(avatar === undefined ? {} : { avatar }),
    });

    return answer.kind === 'done'
      ? context.json(answer.body, 201)
      : context.json(answer.body, answer.status);
  });

  app.openapi(accountProfileRoutes.update, async (context) => {
    const asked = await asAdministrator(context.req.raw.headers, context.req.valid('param').userId);

    if ('refusal' in asked) {
      return context.json(asked.refusal, asked.status);
    }

    const { name, colour, avatar } = context.req.valid('json');
    const answer = await asked.management.update(
      asked.manager,
      context.req.valid('param').profileId,
      { name, colour, ...(avatar === undefined ? {} : { avatar }) },
    );

    return answer.kind === 'done'
      ? context.body(null, 204)
      : context.json(answer.body, answer.status);
  });

  app.openapi(accountProfileRoutes.remove, async (context) => {
    const asked = await asAdministrator(context.req.raw.headers, context.req.valid('param').userId);

    if ('refusal' in asked) {
      return context.json(asked.refusal, asked.status);
    }

    const answer = await asked.management.remove(
      asked.manager,
      context.req.valid('param').profileId,
    );

    return answer.kind === 'done'
      ? context.body(null, 204)
      : context.json(answer.body, answer.status);
  });

  app.openapi(accountProfileRoutes.pin, async (context) => {
    const asked = await asAdministrator(context.req.raw.headers, context.req.valid('param').userId);

    if ('refusal' in asked) {
      return context.json(asked.refusal, asked.status);
    }

    const { profileId } = context.req.valid('param');
    const answer = await asked.management.setPin(
      asked.manager,
      profileId,
      context.req.valid('json').pin,
    );

    return answer.kind === 'done'
      ? context.body(null, 204)
      : context.json(answer.body, answer.status);
  });

  app.openapi(accountProfileRoutes.mayRequest, async (context) => {
    const asked = await asAdministrator(context.req.raw.headers, context.req.valid('param').userId);

    if ('refusal' in asked) {
      return context.json(asked.refusal, asked.status);
    }

    const answer = await asked.management.setMayRequest(
      asked.manager,
      context.req.valid('param').profileId,
      context.req.valid('json').mayRequest,
    );

    return answer.kind === 'done'
      ? context.body(null, 204)
      : context.json(answer.body, answer.status);
  });

  app.openapi(accountProfileRoutes.owner, async (context) => {
    const asked = await asAdministrator(context.req.raw.headers, context.req.valid('param').userId);

    if ('refusal' in asked) {
      return context.json(asked.refusal, asked.status);
    }

    const answer = await asked.management.handOver(
      asked.manager,
      context.req.valid('param').profileId,
    );

    return answer.kind === 'done'
      ? context.body(null, 204)
      : context.json(answer.body, answer.status);
  });

  app.openapi(accountProfileRoutes.libraries, async (context) => {
    const asked = await asAdministrator(context.req.raw.headers, context.req.valid('param').userId);

    if ('refusal' in asked) {
      return context.json(asked.refusal, asked.status);
    }

    const answer = await asked.management.libraries(
      asked.manager,
      context.req.valid('param').profileId,
    );

    return answer.kind === 'done'
      ? context.json(answer.body, 200)
      : context.json(answer.body, answer.status);
  });

  app.openapi(accountProfileRoutes.allowLibrary, async (context) => {
    const asked = await asAdministrator(context.req.raw.headers, context.req.valid('param').userId);

    if ('refusal' in asked) {
      return context.json(asked.refusal, asked.status);
    }

    const { profileId, libraryId } = context.req.valid('param');
    const answer = await asked.management.limitLibrary(asked.manager, profileId, libraryId, {
      kind: 'allow',
    });

    return answer.kind === 'done'
      ? context.body(null, 204)
      : context.json(answer.body, answer.status);
  });

  app.openapi(accountProfileRoutes.refuseLibrary, async (context) => {
    const asked = await asAdministrator(context.req.raw.headers, context.req.valid('param').userId);

    if ('refusal' in asked) {
      return context.json(asked.refusal, asked.status);
    }

    const { profileId, libraryId } = context.req.valid('param');
    const answer = await asked.management.limitLibrary(asked.manager, profileId, libraryId, {
      kind: 'refuse',
    });

    return answer.kind === 'done'
      ? context.body(null, 204)
      : context.json(answer.body, answer.status);
  });

  app.openapi(accountProfileRoutes.setCeiling, async (context) => {
    const asked = await asAdministrator(context.req.raw.headers, context.req.valid('param').userId);

    if ('refusal' in asked) {
      return context.json(asked.refusal, asked.status);
    }

    const { profileId, libraryId } = context.req.valid('param');
    const answer = await asked.management.limitLibrary(asked.manager, profileId, libraryId, {
      kind: 'ceiling',
      ...context.req.valid('json'),
    });

    return answer.kind === 'done'
      ? context.body(null, 204)
      : context.json(answer.body, answer.status);
  });

  app.openapi(accountProfileRoutes.clearCeiling, async (context) => {
    const asked = await asAdministrator(context.req.raw.headers, context.req.valid('param').userId);

    if ('refusal' in asked) {
      return context.json(asked.refusal, asked.status);
    }

    const { profileId, libraryId } = context.req.valid('param');
    const answer = await asked.management.limitLibrary(asked.manager, profileId, libraryId, {
      kind: 'noCeiling',
    });

    return answer.kind === 'done'
      ? context.body(null, 204)
      : context.json(answer.body, answer.status);
  });
};

export { serveAdminProfiles };
