import { promoteProfileRoute } from '@ValenceServer/routes/ProfileRoute';
import {
  chooseProfileRoute,
  forgetChosenProfileRoute,
  ownProfileRoutes,
} from '@ValenceServer/routes/ProfileManagementRoute';
import type { ProfileManager } from '@ValenceServer/profiles/management/ProfileManager';
import type { Acting } from '@ValenceServer/profiles/acting/Acting';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';
import { brandsOf } from '@ValenceServer/web/brandsOf';

/**
 * Who is managing the profiles on their own account: its owner, or a profile acting for itself.
 *
 * @param acting - Who is acting for the request.
 * @returns The manager, or nothing where no profile has been chosen yet.
 */
const managerOf = (acting: Acting): ProfileManager | null =>
  acting.profile === null
    ? null
    : {
        kind: acting.profile.isOwner ? 'owner' : 'self',
        accountId: acting.account.id,
        profileId: acting.profile.id,
      };

/**
 * Registers the profile endpoints: listing and choosing who is watching, locking a device again,
 * and everything the owner of an account, or a profile acting for itself, may change.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveProfile = (app: OpenAPIHono, context: AppContext): void => {
  const {
    profiles,
    promoteProfile,
    readActing,
    readActor,
    refusalOver,
    profileManagement: management,
    callerOf,
  } = context;

  /**
   * Who is asking and how they may manage profiles, or the refusal to answer with.
   *
   * @param headers - The request's headers.
   * @returns Who is acting and as which manager, or why not.
   */
  const asManager = async (headers: Headers) => {
    const acting = await readActing(headers);

    if (acting === null || management === undefined) {
      return { refusal: refuse('error.common.nobodyIsSignedIn'), status: 401 } as const;
    }

    const manager = managerOf(acting);

    if (manager === null) {
      return { refusal: refuse('error.profiles.chooseWhoIsWatching'), status: 403 } as const;
    }

    return { acting, manager, management } as const;
  };

  app.openapi(ownProfileRoutes.list, async (context) => {
    const acting = await readActing(context.req.raw.headers);

    if (acting === null || management === undefined) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    return context.json(await management.list(acting.account.id, acting.profile?.id ?? null), 200);
  });

  app.openapi(chooseProfileRoute, async (context) => {
    const acting = await readActing(context.req.raw.headers);

    if (acting === null || management === undefined) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const answer = await management.choose(
      acting,
      context.req.valid('param').profileId,
      context.req.valid('json'),
      {
        userAgent: context.req.header('user-agent') ?? null,
        brands: brandsOf(context.req.header('sec-ch-ua')),
        address: callerOf?.(context) ?? null,
      },
    );

    return answer.kind === 'done'
      ? context.json(answer.body, 200)
      : context.json(answer.body, answer.status);
  });

  app.openapi(forgetChosenProfileRoute, async (context) => {
    const acting = await readActing(context.req.raw.headers);

    if (acting === null || management === undefined) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    await management.forget(acting);

    return context.body(null, 204);
  });

  app.openapi(ownProfileRoutes.create, async (context) => {
    const asked = await asManager(context.req.raw.headers);

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

  app.openapi(ownProfileRoutes.update, async (context) => {
    const asked = await asManager(context.req.raw.headers);

    if ('refusal' in asked) {
      return context.json(asked.refusal, asked.status);
    }

    const {
      name,
      colour,
      avatar,
      askStillWatchingAfter,
      showsWhatIamWatching,
      discordPresence,
      prefersBestCopy,
    } = context.req.valid('json');

    const answer = await asked.management.update(
      asked.manager,
      context.req.valid('param').profileId,
      {
        name,
        colour,
        ...(avatar === undefined ? {} : { avatar }),
        ...(askStillWatchingAfter === undefined ? {} : { askStillWatchingAfter }),
        ...(showsWhatIamWatching === undefined ? {} : { showsWhatIamWatching }),
        ...(discordPresence === undefined ? {} : { discordPresence }),
        ...(prefersBestCopy === undefined ? {} : { prefersBestCopy }),
      },
    );

    return answer.kind === 'done'
      ? context.body(null, 204)
      : context.json(answer.body, answer.status);
  });

  app.openapi(ownProfileRoutes.remove, async (context) => {
    const asked = await asManager(context.req.raw.headers);

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

  app.openapi(ownProfileRoutes.pin, async (context) => {
    const asked = await asManager(context.req.raw.headers);

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

  app.openapi(ownProfileRoutes.mayRequest, async (context) => {
    const asked = await asManager(context.req.raw.headers);

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

  app.openapi(ownProfileRoutes.owner, async (context) => {
    const asked = await asManager(context.req.raw.headers);

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

  app.openapi(ownProfileRoutes.libraries, async (context) => {
    const asked = await asManager(context.req.raw.headers);

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

  app.openapi(ownProfileRoutes.allowLibrary, async (context) => {
    const asked = await asManager(context.req.raw.headers);

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

  app.openapi(ownProfileRoutes.refuseLibrary, async (context) => {
    const asked = await asManager(context.req.raw.headers);

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

  app.openapi(ownProfileRoutes.setCeiling, async (context) => {
    const asked = await asManager(context.req.raw.headers);

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

  app.openapi(ownProfileRoutes.clearCeiling, async (context) => {
    const asked = await asManager(context.req.raw.headers);

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

  app.openapi(promoteProfileRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.manage')) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    if (profiles === undefined || promoteProfile === undefined) {
      return context.json(refuse('error.common.noSuchProfile'), 404);
    }

    const { profileId } = context.req.valid('param');
    const standing = await profiles.standingOf(profileId);

    if (standing === null) {
      return context.json(refuse('error.common.noSuchProfile'), 404);
    }

    if (standing.isOwner) {
      return context.json(refuse('error.profiles.theOwnerProfileStaysOnItsAccount'), 403);
    }

    const refusal = await refusalOver(actor, standing.userId);

    if (refusal !== null) {
      return context.json(refusal, 403);
    }

    const { email, password } = context.req.valid('json');

    const outcome = await promoteProfile({ profileId, email, password });

    if (outcome.kind === 'failed') {
      return context.json(refuse('error.common.theAccountCouldNotBeMade'), 500);
    }

    if (outcome.kind === 'taken') {
      return context.json(refuse('error.profile.thatAddressAlreadyHasAnAccount'), 409);
    }

    if (outcome.kind === 'missing') {
      return context.json(refuse('error.common.noSuchProfile'), 404);
    }

    return context.json(outcome.profile, 200);
  });
};

export { serveProfile };
