import { z } from 'zod';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';
import { refuseWith } from '@ValenceI18n/refuseWith';
import { realEmailOf } from '@ValenceContracts/functions/realEmailOf';
import { DEFAULT_SETUP_LINK_LIFETIME, UsernameSchema } from '@ValenceContracts/schemas/SetupLink';
import { checkAccountAction } from '@ValenceServer/auth/checkAccountAction';
import { linkOriginOf } from '@ValenceServer/accounts/setupLinks/linkOriginOf';
import { hashSetupToken } from '@ValenceServer/accounts/setupLinks/hashSetupToken';
import {
  emailSetupLinkRoute,
  firstPasswordRoute,
  issueSetupLinkRoute,
  readSetupLinkRoute,
  redeemSetupLinkRoute,
  revokeSetupLinkRoute,
  usernameAvailableRoute,
} from '@ValenceServer/routes/SetupLinkRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';

const FinishedSchema = z.object({ isSignedIn: z.boolean() });

/**
 * Registers the setup link endpoints: an administrator making, revoking and emailing an account's
 * link, and the page its owner opens, which needs no session.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveSetupLinks = (app: OpenAPIHono, context: AppContext): void => {
  const {
    auth,
    setupLinks,
    email,
    listUsers,
    permissions,
    readActor,
    theOwner,
    describeAccountRefusal,
    requires,
    settings,
    trustedOrigins,
  } = context;

  /**
   * Checks that whoever is asking may hand out a link for an account: they hold the right to add
   * accounts or to look after their security, and they outrank it.
   *
   * @param headers - The request's headers.
   * @param userId - The account the link is for.
   * @returns Who is asking, or the refusal to answer with.
   */
  const mayHandOut = async (headers: Headers, userId: string) => {
    const actor = await readActor(headers);

    if (
      actor === null ||
      !(actor.permissions.has('account.invite') || actor.permissions.has('account.security'))
    ) {
      return { refusal: refuse('common.thatIsForAdministrators') };
    }

    if (actor.id !== userId) {
      const target = await permissions.rolesFor(userId);
      const refusal = checkAccountAction({
        actorId: actor.id,
        ownerId: await theOwner(),
        actorHighestPosition: actor.highestPosition,
        targetId: userId,
        targetHighestPosition:
          target.length === 0 ? null : Math.max(...target.map((role) => role.position)),
      });

      if (refusal !== null) {
        return { refusal: describeAccountRefusal(refusal) };
      }
    }

    return { actorId: actor.id };
  };

  /**
   * The origin a link made in this request should open on.
   *
   * @param headers - The request's headers.
   * @returns The origin, or undefined for the server's own address.
   */
  const originFor = async (headers: Headers) =>
    linkOriginOf(
      headers,
      await (trustedOrigins?.() ?? settings.read().then((read) => read.trustedOrigins)),
    );

  /**
   * Finds an account by its identifier.
   *
   * @param userId - The account.
   * @returns Its name and address, or null.
   */
  const findAccount = async (userId: string) =>
    ((await listUsers?.()) ?? []).find((one) => one.id === userId) ?? null;

  app.openapi(issueSetupLinkRoute, async (context) => {
    const { userId } = context.req.valid('param');
    const allowed = await mayHandOut(context.req.raw.headers, userId);

    if ('refusal' in allowed) {
      return context.json(allowed.refusal, 403);
    }

    if (setupLinks === undefined || (await findAccount(userId)) === null) {
      return context.json(refuse('error.account.noSuchAccount'), 404);
    }

    const issued = await setupLinks.issue(userId, {
      lifetimeDays: context.req.valid('json').lifetimeDays,
      by: allowed.actorId,
      origin: await originFor(context.req.raw.headers),
    });

    return context.json({ url: issued.url, expiresAt: issued.expiresAt.toISOString() }, 201);
  });

  app.openapi(revokeSetupLinkRoute, async (context) => {
    const { userId } = context.req.valid('param');
    const allowed = await mayHandOut(context.req.raw.headers, userId);

    if ('refusal' in allowed) {
      return context.json(allowed.refusal, 403);
    }

    await setupLinks?.revoke(userId);

    return context.body(null, 204);
  });

  app.openapi(emailSetupLinkRoute, async (context) => {
    const { userId } = context.req.valid('param');
    const allowed = await mayHandOut(context.req.raw.headers, userId);

    if ('refusal' in allowed) {
      return context.json(allowed.refusal, 403);
    }

    const found = await findAccount(userId);

    if (setupLinks === undefined || found === null) {
      return context.json(refuse('error.account.noSuchAccount'), 404);
    }

    if (!(await email.isOn('setupLinks'))) {
      return context.json(refuse('error.account.setupLinksAreNotSentByEmail'), 400);
    }

    const to = realEmailOf(found.email);

    if (to === null) {
      return context.json(refuse('error.account.thatAccountHasNoAddress'), 400);
    }

    const body = context.req.valid('json');
    const origin = await originFor(context.req.raw.headers);
    const given = body.token === undefined ? null : await setupLinks.inspect(body.token);
    const link =
      given !== null && body.token !== undefined && given.userId === userId
        ? {
            token: body.token,
            url: setupLinks.linkFor(body.token, origin),
            expiresAt: given.expiresAt,
          }
        : await setupLinks.issue(userId, {
            lifetimeDays: body.lifetimeDays ?? DEFAULT_SETUP_LINK_LIFETIME,
            by: allowed.actorId,
            origin,
          });

    const sent = await email.sendSetupLink({
      to,
      name: found.name,
      url: link.url,
      expiresAt: link.expiresAt,
      idempotencyKey: `setup-link:${hashSetupToken(link.token)}`,
    });

    if (sent.kind === 'off') {
      return context.json(refuse('error.account.setupLinksAreNotSentByEmail'), 400);
    }

    if (sent.kind === 'failed') {
      return context.json(refuseWith(sent.problem), 502);
    }

    return context.json({ url: link.url, expiresAt: link.expiresAt.toISOString() }, 200);
  });

  app.openapi(usernameAvailableRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'account.manage'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const { username, userId } = context.req.valid('query');
    const wanted = UsernameSchema.safeParse(username);

    if (!wanted.success) {
      return context.json({ isAvailable: false }, 200);
    }

    const holder = ((await listUsers?.()) ?? []).find(
      (one) => one.username?.toLowerCase() === wanted.data.toLowerCase(),
    );

    return context.json({ isAvailable: holder === undefined || holder.id === userId }, 200);
  });

  app.openapi(readSetupLinkRoute, async (context) => {
    const { token } = context.req.valid('param');
    const found = await setupLinks?.inspect(token);

    if (found === undefined || found === null) {
      return context.json(refuse('error.setupLink.thatLinkNoLongerWorks'), 404);
    }

    return context.json(
      {
        name: found.name,
        username: found.username,
        suggestedUsername: found.suggestedUsername,
        hasEmail: found.email !== null,
        hasPassword: found.hasPassword,
        canResetPassword: await email.isOn('passwordResets'),
        expiresAt: found.expiresAt.toISOString(),
      },
      200,
    );
  });

  app.openapi(firstPasswordRoute, async (context) => {
    const { password } = context.req.valid('json');
    const set = await auth.api
      .setPassword({ body: { newPassword: password }, headers: context.req.raw.headers })
      .then(() => 'set' as const)
      .catch(() => 'refused' as const);

    if (set === 'refused') {
      const session = await auth.api
        .getSession({ headers: context.req.raw.headers })
        .catch(() => null);

      return session === null
        ? context.json(refuse('error.common.nobodyIsSignedIn'), 401)
        : context.json(refuse('error.setupLink.thatAccountAlreadyHasAPassword'), 400);
    }

    return context.body(null, 204);
  });

  app.openapi(redeemSetupLinkRoute, async (context) => {
    const { token } = context.req.valid('param');
    const body = context.req.valid('json');

    if (setupLinks === undefined) {
      return context.json(refuse('error.setupLink.thatLinkNoLongerWorks'), 404);
    }

    if (body.email !== undefined && realEmailOf(body.email) === null) {
      return context.json(refuse('error.account.thatAddressCannotBeUsed'), 400);
    }

    const redeemed = await setupLinks.redeem(token, {
      ...(body.username === undefined ? {} : { username: body.username }),
      ...(body.email === undefined ? {} : { email: body.email }),
    });

    if (redeemed.kind === 'gone') {
      return context.json(refuse('error.setupLink.thatLinkNoLongerWorks'), 404);
    }

    if (redeemed.kind === 'needsUsername') {
      return context.json(refuse('error.setupLink.chooseAUsernameToSignInWith'), 400);
    }

    if (redeemed.kind === 'taken') {
      return context.json(
        refuse(
          redeemed.field === 'username'
            ? 'error.account.thatUsernameIsAlreadyInUse'
            : 'error.account.thatAddressIsAlreadyInUse',
        ),
        400,
      );
    }

    const finished = await auth.api.finishSetup({
      body: {
        userId: redeemed.userId,
        ...(body.password === undefined ? {} : { password: body.password }),
      },
      headers: context.req.raw.headers,
      asResponse: true,
    });
    const told = FinishedSchema.safeParse(
      await finished
        .clone()
        .json()
        .catch(() => null),
    );
    const answer = context.json(
      { isSignedIn: finished.ok && told.success && told.data.isSignedIn },
      200,
    );

    for (const cookie of finished.headers.getSetCookie()) {
      answer.headers.append('set-cookie', cookie);
    }

    return answer;
  });
};

export { serveSetupLinks };
