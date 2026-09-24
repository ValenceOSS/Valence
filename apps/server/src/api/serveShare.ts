import type { Subject } from '@ValenceServer/visibility/subjectOfRequest';
import {
  createShareRoute,
  listSharesRoute,
  listEverybodysSharesRoute,
  revokeShareRoute,
  revokeAnybodysShareRoute,
  openShareRoute,
} from '@ValenceServer/routes/ShareRoute';
import { SHARE_COOKIE } from '@ValenceServer/sharing/createShareGate';
import { howShareEnded, isShareLive, whyShareEnded } from '@ValenceContracts/schemas/Share';
import { rememberGuestFor } from '@ValenceServer/sharing/rememberGuestFor';
import { getCookie, setCookie } from 'hono/cookie';
import { randomUUID } from 'node:crypto';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the share endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveShare = (app: OpenAPIHono, context: AppContext): void => {
  const {
    library,
    shares,
    books,
    sayALinkWasWithdrawn,
    SHARE_JOINER,
    GUEST_REMEMBERED_FOR_SECONDS,
    requires,
    bookInReach,
    isOutOfReach,
    readAccount,
  } = context;

  app.openapi(createShareRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || shares === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    if (!(await requires(context.req.raw.headers, 'sharing.link'))) {
      return context.json({ error: 'This account may not share.' }, 403);
    }

    const asked = context.req.valid('json');

    if (asked.kind === 'book') {
      const made =
        asked.bookId === undefined || !(await bookInReach(context.req.raw.headers, asked.bookId))
          ? null
          : await shares.create(account.id, asked);

      return made === null
        ? context.json({ error: 'There is nothing here to share.' }, 404)
        : context.json(made, 201);
    }

    const subjectId = asked.kind === 'item' ? asked.mediaId : asked.seriesId;

    const wanted: Subject =
      subjectId === undefined
        ? { kind: 'none' }
        : asked.kind === 'item'
          ? { kind: 'item', mediaId: subjectId }
          : { kind: 'series', seriesId: subjectId };

    if (await isOutOfReach(account.id, wanted)) {
      return context.json({ error: 'There is nothing here to share.' }, 404);
    }

    const made = await shares.create(account.id, asked);

    if (made === null) {
      return context.json({ error: 'There is nothing here to share.' }, 404);
    }

    return context.json(made, 201);
  });

  app.openapi(listSharesRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || shares === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    return context.json({ shares: await shares.list(account.id) }, 200);
  });

  app.openapi(listEverybodysSharesRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || shares === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    if (!(await requires(context.req.raw.headers, 'sharing.manage'))) {
      return context.json({ error: 'This account may not look at everybody’s links.' }, 403);
    }

    return context.json({ shares: await shares.listEverybody() }, 200);
  });

  app.openapi(revokeAnybodysShareRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || shares === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    if (!(await requires(context.req.raw.headers, 'sharing.manage'))) {
      return context.json({ error: 'This account may not withdraw somebody else’s link.' }, 403);
    }

    const withdrawn = await shares.revokeAnybody(context.req.valid('param').shareId);

    if (withdrawn === null) {
      return context.json({ error: 'No such link.' }, 404);
    }

    if (withdrawn.createdBy !== account.id) {
      await sayALinkWasWithdrawn?.({
        accountId: withdrawn.createdBy,
        title: withdrawn.title,
        byName: account.name,
      });
    }

    return context.body(null, 204);
  });

  app.openapi(revokeShareRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || shares === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const withdrawn = await shares.revoke(account.id, context.req.valid('param').shareId);

    if (!withdrawn) {
      return context.json({ error: 'No such link.' }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(openShareRoute, async (context) => {
    if (shares === undefined) {
      return context.json({ error: 'This link does not work.' }, 404);
    }

    const { token } = context.req.valid('param');
    const found = await shares.resolve(token);

    if (found === null) {
      return context.json({ error: 'This link does not work.' }, 404);
    }

    const held = getCookie(context, SHARE_JOINER);
    const joiner = held ?? randomUUID();

    const standing = {
      expiresAt: found.expiresAt,
      viewCap: found.viewCap,
      views: found.views,
      revokedAt: found.revokedAt,
      isReturning: held !== undefined && (await shares.hasJoined(found.id, held)),
    };

    if (!isShareLive(standing, new Date())) {
      return context.json(
        {
          error: whyShareEnded(standing, new Date()) ?? 'This link no longer works.',
          ended: howShareEnded(standing, new Date()) ?? 'withdrawn',
        },
        410,
      );
    }

    await shares.join(found.id, joiner);

    const keptFor = rememberGuestFor(found.expiresAt, new Date(), GUEST_REMEMBERED_FOR_SECONDS);
    const kept = { path: '/', httpOnly: true, sameSite: 'Lax', maxAge: keptFor } as const;

    setCookie(context, SHARE_JOINER, joiner, kept);
    setCookie(context, SHARE_COOKIE, token, kept);

    if (found.kind === 'book') {
      const shared =
        books === undefined || found.bookId === null ? null : await books.read(found.bookId);

      return context.json(
        { kind: found.kind, title: found.title, items: [], book: shared?.book ?? null },
        200,
      );
    }

    const items = await library.itemsForShare({
      kind: found.kind === 'series' ? 'series' : 'item',
      mediaId: found.mediaId,
      seriesId: found.seriesId,
    });

    return context.json({ kind: found.kind, title: found.title, items, book: null }, 200);
  });
};

export { serveShare };
