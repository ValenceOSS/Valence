import {
  pairRoute,
  pairingStateRoute,
  serverRoute,
  unlinkRoute,
} from '@ValenceServer/routes/FederationRoute';
import {
  approveRoute,
  changeIdentityRoute,
  checkRoute,
  linkingRoute,
  makeInviteRoute,
  refuseRoute,
  unlinkServerRoute,
  useInviteRoute,
  withdrawInviteRoute,
} from '@ValenceServer/routes/LinkingRoute';
import { createLinkKeeper } from '@ValenceServer/api/createLinkKeeper';
import { FEDERATION_PATH } from '@ValenceServer/linking/FEDERATION_PATH';
import { OWN_PICTURE_KEY } from '@ValenceServer/linking/OWN_PICTURE_KEY';
import { linkedPictureKey } from '@ValenceServer/linking/linkedPictureKey';
import { describePictureFault } from '@ValenceServer/profiles/describePictureFault';
import { bodyOf } from '@ValenceI18n/bodyOf';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { InviteRefusal, PairRefusal } from '@ValenceServer/linking/LinkService';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';

const INVITE_REFUSALS = {
  notAnInvite: { body: refuse('error.linking.thatIsNotAnInvite'), status: 400 },
  inviteSpent: { body: refuse('error.linking.thatInviteHasBeenUsed'), status: 400 },
  alreadyLinked: { body: refuse('error.linking.alreadyLinked'), status: 409 },
  itself: { body: refuse('error.linking.thatInviteIsFromThisServer'), status: 409 },
  unreachable: { body: refuse('error.linking.thatServerCouldNotBeReached'), status: 502 },
  notTheServerThatInvited: {
    body: refuse('error.linking.notTheServerThatMadeTheInvite'),
    status: 502,
  },
} as const satisfies Record<InviteRefusal, { body: object; status: number }>;

const PAIR_REFUSALS = {
  inviteSpent: { body: refuse('error.linking.thatInviteHasBeenUsed'), status: 400 },
  alreadyLinked: { body: refuse('error.linking.alreadyLinked'), status: 409 },
  itself: { body: refuse('error.linking.thatInviteIsFromThisServer'), status: 409 },
} as const satisfies Record<PairRefusal, { body: object; status: number }>;

/**
 * The token another server signed a request with, from its `Authorization` header.
 *
 * @param header - The header as it arrived.
 * @returns The token.
 */
const tokenOf = (header: string): string => header.slice('Bearer '.length);

/**
 * Registers the linking endpoints: those another Valence calls while linking with this one, which
 * need no session and are believed only as far as their signature, and those this server's admin
 * uses to name it, hand out invites, use one, and approve, check or end a link.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveLinking = (app: OpenAPIHono, context: AppContext): void => {
  const { linking, tellLinkedOfChange, serverPictures, tooBigToRead, readAccount } = context;

  const keeper = createLinkKeeper(context);

  app.openapi(serverRoute, async (context) => context.json(await linking.publicIdentity(), 200));

  app.get(`${FEDERATION_PATH}/server/picture`, async (context) => {
    const picture = await serverPictures?.read(OWN_PICTURE_KEY);

    return picture === undefined || picture === null
      ? context.json(refuse('error.linking.thatServerHasNoPicture'), 404)
      : context.body(picture.body.slice().buffer, 200, {
          'content-type': picture.contentType,
          'cache-control': 'public, max-age=300',
        });
  });

  app.get('/api/linked-servers/identity/picture', async (context) => {
    const picture =
      (await readAccount(context.req.raw.headers)) === null
        ? null
        : await serverPictures?.read(OWN_PICTURE_KEY);

    return picture === undefined || picture === null
      ? context.json(refuse('error.linking.thatServerHasNoPicture'), 404)
      : context.body(picture.body.slice().buffer, 200, {
          'content-type': picture.contentType,
          'cache-control': 'private, max-age=31536000, immutable',
        });
  });

  app.put('/api/linked-servers/identity/picture', tooBigToRead(), async (context) => {
    const refusal = await keeper(context.req.raw.headers);

    if (refusal !== null) {
      return context.json(refusal.body, refusal.status);
    }

    const wrong =
      serverPictures === undefined
        ? 'unreadable'
        : await serverPictures.save(OWN_PICTURE_KEY, {
            body: new Uint8Array(await context.req.arrayBuffer()),
            contentType: context.req.header('content-type') ?? '',
          });

    if (wrong !== null) {
      const said = describePictureFault(wrong);

      return context.json(bodyOf(said), said.status);
    }

    const changed = await linking.changePicture(new Date().toISOString());

    void tellLinkedOfChange({});

    return context.json(changed, 200);
  });

  app.delete('/api/linked-servers/identity/picture', async (context) => {
    const refusal = await keeper(context.req.raw.headers);

    if (refusal !== null) {
      return context.json(refusal.body, refusal.status);
    }

    await serverPictures?.remove(OWN_PICTURE_KEY);

    const changed = await linking.changePicture(null);

    void tellLinkedOfChange({});

    return context.json(changed, 200);
  });

  app.get('/api/linked-servers/:id/picture', async (context) => {
    const picture =
      (await readAccount(context.req.raw.headers)) === null
        ? null
        : await serverPictures?.read(linkedPictureKey(context.req.param('id')));

    return picture === undefined || picture === null
      ? context.json(refuse('error.linking.thatServerHasNoPicture'), 404)
      : context.body(picture.body.slice().buffer, 200, {
          'content-type': picture.contentType,
          'cache-control': 'private, max-age=31536000, immutable',
        });
  });

  app.openapi(pairRoute, async (context) => {
    const paired = await linking.pair(context.req.valid('json'));

    if (paired.kind === 'refused') {
      const refusal = PAIR_REFUSALS[paired.why];

      return context.json(refusal.body, refusal.status);
    }

    return context.json(paired.answer, 201);
  });

  app.openapi(pairingStateRoute, async (context) => {
    const answer = await linking.pairingState(
      context.req.valid('param').pairingId,
      tokenOf(context.req.valid('header').authorization),
    );

    return answer === null
      ? context.json(refuse('error.linking.notSignedByALinkedServer'), 404)
      : context.json(answer, 200);
  });

  app.openapi(unlinkRoute, async (context) => {
    const isHeard = await linking.hearUnlinked(tokenOf(context.req.valid('header').authorization));

    return isHeard
      ? context.json({ isUnlinked: true }, 200)
      : context.json(refuse('error.linking.notSignedByALinkedServer'), 404);
  });

  app.openapi(linkingRoute, async (context) => {
    const refusal = await keeper(context.req.raw.headers);

    return refusal === null
      ? context.json(await linking.linking(), 200)
      : context.json(refusal.body, refusal.status);
  });

  app.openapi(changeIdentityRoute, async (context) => {
    const refusal = await keeper(context.req.raw.headers);

    if (refusal !== null) {
      return context.json(refusal.body, refusal.status);
    }

    const changed = await linking.changeIdentity(context.req.valid('json'));

    void tellLinkedOfChange({});

    return context.json(changed, 200);
  });

  app.openapi(makeInviteRoute, async (context) => {
    const refusal = await keeper(context.req.raw.headers);

    return refusal === null
      ? context.json(await linking.makeInvite(), 201)
      : context.json(refusal.body, refusal.status);
  });

  app.openapi(withdrawInviteRoute, async (context) => {
    const refusal = await keeper(context.req.raw.headers);

    if (refusal !== null) {
      return context.json(refusal.body, refusal.status);
    }

    return (await linking.withdrawInvite(context.req.valid('param').id))
      ? context.body(null, 204)
      : context.json(refuse('error.linking.noSuchInvite'), 404);
  });

  app.openapi(useInviteRoute, async (context) => {
    const refusal = await keeper(context.req.raw.headers);

    if (refusal !== null) {
      return context.json(refusal.body, refusal.status);
    }

    const used = await linking.useInvite(context.req.valid('json').invite);

    if (used.kind === 'refused') {
      const why = INVITE_REFUSALS[used.why];

      return context.json(why.body, why.status);
    }

    return context.json(used.server, 201);
  });

  app.openapi(approveRoute, async (context) => {
    const refusal = await keeper(context.req.raw.headers);

    if (refusal !== null) {
      return context.json(refusal.body, refusal.status);
    }

    const server = await linking.approve(context.req.valid('param').id);

    return server === null
      ? context.json(refuse('error.linking.noSuchServer'), 404)
      : context.json(server, 200);
  });

  app.openapi(refuseRoute, async (context) => {
    const refusal = await keeper(context.req.raw.headers);

    if (refusal !== null) {
      return context.json(refusal.body, refusal.status);
    }

    const server = await linking.refuse(context.req.valid('param').id);

    return server === null
      ? context.json(refuse('error.linking.noSuchServer'), 404)
      : context.json(server, 200);
  });

  app.openapi(checkRoute, async (context) => {
    const refusal = await keeper(context.req.raw.headers);

    if (refusal !== null) {
      return context.json(refusal.body, refusal.status);
    }

    const server = await linking.check(context.req.valid('param').id);

    return server === null
      ? context.json(refuse('error.linking.noSuchServer'), 404)
      : context.json(server, 200);
  });

  app.openapi(unlinkServerRoute, async (context) => {
    const refusal = await keeper(context.req.raw.headers);

    if (refusal !== null) {
      return context.json(refusal.body, refusal.status);
    }

    return (await linking.unlink(context.req.valid('param').id))
      ? context.body(null, 204)
      : context.json(refuse('error.linking.noSuchServer'), 404);
  });
};

export { serveLinking };
