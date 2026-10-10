import { createMiddleware } from 'hono/factory';
import { z } from 'zod';
import {
  catalogueRoute,
  sharedActivityRoute,
  sharedLibrariesRoute,
} from '@ValenceServer/routes/FederationRoute';
import {
  activityRoute,
  blockPersonRoute,
  changeSharingRoute,
  readSharingRoute,
  remotePeopleRoute,
  theirActivityRoute,
  askableRoute,
  facesRoute,
  syncRoute,
  theirLibrariesRoute,
  chooseTheirLibraryRoute,
  unblockPersonRoute,
} from '@ValenceServer/routes/LinkSharingRoute';
import { createLinkKeeper } from '@ValenceServer/api/createLinkKeeper';
import { handlePartyMessage } from '@ValenceServer/parties/handlePartyMessage';
import { peerMayReach } from '@ValenceServer/linking/peerMayReach';
import { PEER_MEMBER } from '@ValenceServer/linking/parties/PEER_MEMBER';
import { FromClientSchema } from '@ValenceContracts/schemas/Realtime';
import { AskedAlongSchema } from '@ValenceContracts/schemas/LinkSharing';
import { MediaRequestAskSchema } from '@ValenceContracts/schemas/MediaRequest';
import { StartResponse } from '@ValenceServer/routes/PlaybackRoute';
import { PeerAskSchema } from '@ValenceServer/linking/content/PeerAskSchema';
import { ceilingOf } from '@ValenceServer/linking/content/ceilingOf';
import { createDirectTickets } from '@ValenceServer/linking/content/createDirectTickets';
import { QualityStepIdSchema } from '@ValenceContracts/schemas/QualityStep';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { PeerAsk } from '@ValenceServer/linking/content/PeerAskSchema';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import { FEDERATION_PATH } from '@ValenceServer/linking/FEDERATION_PATH';
import type { Admission } from '@ValenceServer/linking/LinkSharingService';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';
import { saying } from '@ValenceI18n/saying';
import { say } from '@ValenceI18n/say';

type Admitted = Extract<Admission, { kind: 'admitted' }>;

const FORWARDED_HEADERS = ['accept', 'content-type', 'range', 'if-none-match', 'if-range'] as const;

const STARTED_SESSION = /^\/api\/playback\/[0-9a-fA-F-]{36}\/session$/;

const READ_THUMBNAILS = /^\/api\/playback\/[0-9a-fA-F-]{36}\/trickplay$/;

const STOPPED_SESSION = /^\/api\/playback\/session\/([^/]+)$/;

const StartedSchema = z.object({
  sessionId: z.string().min(1),
  delivery: z.object({ kind: z.enum(['hls', 'direct']) }),
});

const AskedToStartSchema = z
  .object({ requestedQuality: QualityStepIdSchema.optional() })
  .catchall(JsonValueSchema);

const BeatSchema = z.object({ isPlaying: z.boolean() });

const PartySaySchema = z.object({
  connection: z.string().min(1).max(100),
  message: FromClientSchema,
});

const PEER_ACCOUNT = 'peer:';

const DirectAskSchema = z
  .object({
    sessionId: z.string().min(1).max(200).optional(),
    mediaId: z.string().uuid().optional(),
  })
  .refine((asked) => (asked.sessionId === undefined) !== (asked.mediaId === undefined));

/**
 * What a request sent, read as JSON, or nothing where it is not.
 *
 * @param bytes - The body.
 * @returns The JSON, or nothing.
 */
const jsonIn = (bytes: ArrayBuffer): JsonValue | null => {
  try {
    return JsonValueSchema.parse(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
};

const HEARTBEAT = /^\/api\/playback\/session\/([^/]+)\/heartbeat$/;

const ThumbnailsSchema = z.object({ id: z.string().min(1) });

/**
 * Registers what this server shares with the servers it is linked with: the gate every request
 * from one of them passes, the routes they call once through it, and the routes this server's admin
 * uses to choose what each is shared, see and block their people, and read the record of what they
 * asked for — and the same about what each linked server shares with this one.
 *
 * The gate reads a request's token once, since a token is believed only once, and the routes behind
 * it read who it admitted from the request itself.
 *
 * A request under `/api` is passed through to this server's own route of the same name, as a share
 * link's guest is let through to it: the gate has already decided it reaches only what is shared,
 * so the route sees it as the server itself. Only the headers that say what is being asked for go
 * with it, never a cookie, and a session it starts is remembered as the asking server's, so only
 * that server reaches the manifest and segments of it. A session starts only within the streams and
 * quality this server allows the asking one, and whoever is watching through it is shown among the
 * people watching here, as somebody from that server. Whatever this server's admin asks of them —
 * to pause, to stop, a message — waits for the other server's next heartbeat and goes back with it,
 * since this server never reaches the other's people itself.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveLinkSharing = (app: OpenAPIHono, context: AppContext): void => {
  const {
    linkSharing,
    linkCatalogue,
    peerClaims,
    peerRequests,
    syncLinkedServer,
    isLinkedServerReachable,
    linking,
    readAccount,
    presence,
    library,
    linkParties,
    linkSharingStore,
    linkedServerTakesRequests,
    draftFor,
    requestsClient,
    requires,
    linkedAsk,
  } = context;
  const asking = new Map<string, PeerAsk[]>();
  const tickets = createDirectTickets();
  const viewerOf = (serverId: string, sessionId: string) => `peer~${serverId}~${sessionId}`;
  const keeper = createLinkKeeper(context);
  const admitted = new WeakMap<Request, Admitted>();

  app.use(
    `${FEDERATION_PATH}/*`,
    createMiddleware(async (context, next) => {
      const admission = await linkSharing.admit({
        method: context.req.method,
        path: context.req.path,
        authorization: context.req.header('authorization'),
      });

      if (admission.kind === 'refused') {
        return context.json(refuse(admission.code), admission.status);
      }

      if (admission.kind === 'admitted') {
        admitted.set(context.req.raw, admission);
      }

      await next();

      return;
    }),
  );

  app.openapi(sharedLibrariesRoute, async (context) => {
    const who = admitted.get(context.req.raw);

    return who === undefined
      ? context.json(refuse('error.linking.notSignedByALinkedServer'), 401)
      : context.json(
          {
            libraries: await linkSharing.sharedWith(who.serverId),
            allowsDownloads: who.sharing?.allowsDownloads ?? false,
            takesRequests: requestsClient !== null && who.sharing?.takesTheirRequests === true,
          },
          200,
        );
  });

  app.openapi(sharedActivityRoute, async (context) => {
    const who = admitted.get(context.req.raw);

    if (who === undefined) {
      return context.json(refuse('error.linking.notSignedByALinkedServer'), 401);
    }

    const { since } = context.req.valid('query');
    const entries = await linkSharing.activityFor(
      who.serverId,
      since === undefined ? undefined : new Date(since),
    );

    return entries === null
      ? context.json(refuse('error.linking.thatServerDoesNotShowItsRecord'), 403)
      : context.json({ entries }, 200);
  });

  app.post(`${FEDERATION_PATH}/parties/say`, async (context) => {
    const who = admitted.get(context.req.raw);

    if (who === undefined || linkParties === null) {
      return context.json(refuse('error.linking.notSignedByALinkedServer'), 401);
    }

    const sent = PartySaySchema.safeParse(
      JsonValueSchema.parse(
        JSON.parse(
          linkParties.hub.asOurs(
            who.serverId,
            JSON.stringify(await context.req.json().catch(() => null)),
          ),
        ),
      ),
    );

    if (!sent.success || !sent.data.message.kind.startsWith('party')) {
      return context.json(refuse('error.linking.thatIsNotSharedWithYourServer'), 400);
    }

    const { connection, message } = sent.data;
    const member = linkParties.hub.memberOf(who.serverId, connection);
    const joining =
      message.kind === 'partyJoin' ? linkParties.binding.registry.find(message.partyId) : null;
    const subject = joining === null ? null : await linkSharing.subjectOfTitle(joining.mediaId);

    if (
      message.kind === 'partyJoin' &&
      (joining === null ||
        subject === null ||
        who.sharing === null ||
        peerMayReach(who.sharing, subject) !== 'allowed')
    ) {
      linkParties.hub.write(member, {
        kind: 'refused',
        why: saying('error.linking.thatIsNotSharedWithYourServer'),
      });

      return context.body(null, 204);
    }

    handlePartyMessage(
      message,
      {
        connectionId: member,
        accountId: `${PEER_ACCOUNT}${who.serverId}`,
        profileId: null,
        name: who.personName ?? say('common.someoneFromName', { name: who.serverName }),
      },
      (answer) => {
        linkParties.hub.write(member, answer);
      },
      linkParties.binding,
      Date.now,
    );

    return context.body(null, 204);
  });

  app.get(`${FEDERATION_PATH}/parties/hear`, async (context) => {
    const who = admitted.get(context.req.raw);

    if (who === undefined || linkParties === null) {
      return context.json(refuse('error.linking.notSignedByALinkedServer'), 401);
    }

    const waitSeconds = Math.min(Math.max(Number(context.req.query('wait') ?? '0') || 0, 0), 25);
    const heard = await linkParties.hub.hear(who.serverId, waitSeconds * 1000);

    return context.json({ heard, serverAtMs: Date.now() }, 200);
  });

  app.post(`${FEDERATION_PATH}/parties/asked`, async (context) => {
    const who = admitted.get(context.req.raw);

    if (who === undefined || linkParties === null) {
      return context.json(refuse('error.linking.notSignedByALinkedServer'), 401);
    }

    const asked = AskedAlongSchema.safeParse(await context.req.json().catch(() => null));

    if (!asked.success) {
      return context.json(refuse('error.linking.thatIsNotSharedWithYourServer'), 400);
    }

    await linkParties.onAskedAlong(who.serverId, asked.data);

    return context.body(null, 204);
  });

  app.post(`${FEDERATION_PATH}/direct`, async (context) => {
    const who = admitted.get(context.req.raw);

    if (who === undefined) {
      return context.json(refuse('error.linking.notSignedByALinkedServer'), 401);
    }

    const asked = DirectAskSchema.safeParse(await context.req.json().catch(() => null));

    if (!asked.success) {
      return context.json(refuse('error.linking.thatIsNotSharedWithYourServer'), 400);
    }

    const { sessionId, mediaId } = asked.data;

    if (sessionId !== undefined) {
      return peerClaims.claimedBy('session', sessionId, who.serverId) === null
        ? context.json(refuse('error.linking.thatIsNotSharedWithYourServer'), 403)
        : context.json(
            {
              ticket: tickets.issue({
                serverId: who.serverId,
                route: `/api/playback/session/${encodeURIComponent(sessionId)}`,
                isWhole: false,
              }),
            },
            200,
          );
    }

    const subject = mediaId === undefined ? null : await linkSharing.subjectOfTitle(mediaId);

    return subject === null ||
      who.sharing === null ||
      peerMayReach(who.sharing, subject) !== 'allowed'
      ? context.json(refuse('error.linking.thatIsNotSharedWithYourServer'), 403)
      : context.json(
          {
            ticket: tickets.issue({
              serverId: who.serverId,
              route: `/api/playback/${subject.id}/file`,
              isWhole: true,
            }),
          },
          200,
        );
  });

  app.get(`${FEDERATION_PATH}/direct/:ticket/:name`, async (context) => {
    const ticketed = tickets.read(context.req.param('ticket'));

    if (ticketed === null) {
      return context.json(refuse('error.linking.thatIsNotSharedWithYourServer'), 403);
    }

    const headers = new Headers();
    const range = context.req.header('range');

    if (range !== undefined) {
      headers.set('range', range);
    }

    const asked = new URL(context.req.url);
    const inner = new Request(
      new URL(
        ticketed.isWhole
          ? ticketed.route
          : `${ticketed.route}/${encodeURIComponent(context.req.param('name'))}`,
        asked.origin,
      ),
      { method: 'GET', headers },
    );

    peerRequests.add(inner.headers);

    const answered = await app.fetch(inner);
    const passedBack = new Headers(answered.headers);

    passedBack.delete('set-cookie');

    return new Response(answered.body, { status: answered.status, headers: passedBack });
  });

  app.post(`${FEDERATION_PATH}/requests`, async (context) => {
    const who = admitted.get(context.req.raw);

    if (who === undefined) {
      return context.json(refuse('error.linking.notSignedByALinkedServer'), 401);
    }

    if (requestsClient === null) {
      return context.json(refuse('error.common.requestingIsOff'), 503);
    }

    if (who.sharing?.takesTheirRequests !== true) {
      return context.json(refuse('error.linking.thatServerTakesNoRequestsFromYours'), 403);
    }

    const asked = MediaRequestAskSchema.safeParse(await context.req.json().catch(() => null));

    if (!asked.success || (asked.data.kind !== 'film' && asked.data.kind !== 'series')) {
      return context.json(refuse('error.common.theCatalogueDoesNotKnowThat'), 400);
    }

    const drafted = await draftFor(
      {
        account: () =>
          Promise.resolve({
            id: `${PEER_ACCOUNT}${who.serverId}:${who.personId ?? 'server'}`,
            name:
              who.personName === null
                ? say('common.someoneFromName', { name: who.serverName })
                : say('common.nameFromServer', { name: who.personName, server: who.serverName }),
          }),
        holds: () => Promise.resolve(false),
      },
      asked.data,
      undefined,
    );

    if (drafted.kind === 'refused') {
      return context.json(refuse('error.common.theCatalogueDoesNotKnowThat'), 400);
    }

    const added = await requestsClient.addRequest(drafted.draft);

    return added.kind === 'answered'
      ? context.json({ title: added.value.request.title, isNew: added.value.isNew }, 201)
      : context.json(refuse('error.common.requestingIsOff'), 503);
  });

  app.post('/api/linked-servers/:id/requests', async (context) => {
    const { headers } = context.req.raw;

    if ((await readAccount(headers)) === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    if (!(await requires(headers, 'requests.ask'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const asked = MediaRequestAskSchema.safeParse(await context.req.json().catch(() => null));

    if (!asked.success) {
      return context.json(refuse('error.common.theCatalogueDoesNotKnowThat'), 400);
    }

    const answered = await linkedAsk(context.req.param('id'), '/requests', {
      method: 'POST',
      headers: new Headers({ 'content-type': 'application/json' }),
      body: new TextEncoder().encode(JSON.stringify(asked.data)).buffer,
    });

    if (answered === null) {
      return context.json(refuse('error.linking.thatServerCouldNotBeReached'), 502);
    }

    return new Response(answered.body, {
      status: answered.status,
      headers: { 'content-type': 'application/json' },
    });
  });

  app.openapi(askableRoute, async (context) => {
    if ((await readAccount(context.req.raw.headers)) === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const { servers } = await linking.linking();
    const people = await Promise.all(
      servers
        .filter((server) => server.state === 'linked')
        .map(async (server) =>
          (await linkSharingStore.listPeople(server.id)).flatMap((person) =>
            person.name === null || person.blockedAt !== null
              ? []
              : [
                  {
                    id: `${PEER_MEMBER}${server.id}~${person.id}`,
                    name: say('common.nameFromServer', { name: person.name, server: server.name }),
                  },
                ],
          ),
        ),
    );

    return context.json({ people: people.flat() }, 200);
  });

  app.openapi(catalogueRoute, async (context) => {
    const who = admitted.get(context.req.raw);

    if (who?.libraryId === null || who === undefined) {
      return context.json(refuse('error.linking.notSignedByALinkedServer'), 401);
    }

    const page = await linkCatalogue(who.libraryId, context.req.valid('query').after ?? null);

    return page === null
      ? context.json(refuse('error.linking.thatIsNotSharedWithYourServer'), 403)
      : context.json(page, 200);
  });

  app.all(`${FEDERATION_PATH}/api/*`, async (context) => {
    const who = admitted.get(context.req.raw);

    if (who?.inner === null || who === undefined) {
      return context.json(refuse('error.linking.notSignedByALinkedServer'), 401);
    }

    const { method } = context.req;
    const headers = new Headers();

    for (const name of FORWARDED_HEADERS) {
      const value = context.req.header(name);

      if (value !== undefined) {
        headers.set(name, value);
      }
    }

    const asked = new URL(context.req.url);
    const isStarting = method === 'POST' && STARTED_SESSION.test(who.inner);
    const sent = method === 'GET' || method === 'HEAD' ? null : await context.req.arrayBuffer();
    const { mostStreams, qualityCeiling } = who.sharing ?? {
      mostStreams: null,
      qualityCeiling: null,
    };

    if (
      isStarting &&
      mostStreams !== null &&
      peerClaims.countOf('session', who.serverId) >= mostStreams
    ) {
      return context.json(refuse('error.linking.yourServerIsPlayingAsMuchAsItMay'), 429);
    }

    const toStart =
      isStarting && qualityCeiling !== null && sent !== null
        ? AskedToStartSchema.safeParse(jsonIn(sent))
        : null;
    const body =
      toStart?.success === true && qualityCeiling !== null
        ? new TextEncoder().encode(
            JSON.stringify({
              ...toStart.data,
              requestedQuality: ceilingOf(toStart.data.requestedQuality, qualityCeiling),
            }),
          ).buffer
        : sent;
    const inner = new Request(new URL(`${who.inner}${asked.search}`, asked.origin), {
      method,
      headers,
      ...(body === null ? {} : { body }),
    });

    peerRequests.add(inner.headers);

    const answered = await app.fetch(inner);
    const stopped = method === 'DELETE' ? STOPPED_SESSION.exec(who.inner)?.[1] : undefined;
    const beating = method === 'POST' ? HEARTBEAT.exec(who.inner)?.[1] : undefined;

    if (answered.ok && isStarting) {
      const started = StartedSchema.safeParse(await answered.clone().json());
      const plan = StartResponse.safeParse(await answered.clone().json());

      if (started.success) {
        const { sessionId } = started.data;
        const watcher = viewerOf(who.serverId, sessionId);
        const item = who.title.mediaId === null ? null : await library.getMedia(who.title.mediaId);

        peerClaims.claim('session', sessionId, who.serverId, who.title);
        presence.connect({
          clientId: watcher,
          socketId: watcher,
          profileId: null,
          profileName: who.personName,
          fromServer: who.serverName,
          deviceLabel: who.serverName,
          send: (event) => {
            const ask = PeerAskSchema.safeParse(event);

            if (ask.success) {
              asking.set(sessionId, [...(asking.get(sessionId) ?? []), ask.data]);
            }
          },
        });

        if (item !== null && plan.success) {
          presence.startPlayback(watcher, {
            mediaId: item.id,
            mediaTitle: item.title,
            seriesTitle: item.metadata.seriesTitle ?? null,
            seasonNumber: item.metadata.seasonNumber ?? null,
            episodeNumber: item.metadata.episodeNumber ?? null,
            hasPoster: item.metadata.hasPoster,
            hasBackdrop: item.metadata.hasBackdrop,
            mode: started.data.delivery.kind === 'hls' ? 'transcode' : 'direct',
            reuse: plan.data.reuse,
            transcoderSessionId: started.data.delivery.kind === 'hls' ? sessionId : null,
            plan: plan.data.plan,
          });
        }
      }
    }

    if (beating !== undefined && sent !== null) {
      const beat = BeatSchema.safeParse(jsonIn(sent));

      if (beat.success) {
        presence.heartbeatPlayback(viewerOf(who.serverId, beating), beat.data.isPlaying);
      }

      const waiting = asking.get(beating) ?? [];

      if (waiting.length > 0) {
        asking.delete(beating);

        return context.json({ asks: waiting }, 200);
      }
    }

    if (answered.ok && method === 'POST' && READ_THUMBNAILS.test(who.inner)) {
      const thumbnails = ThumbnailsSchema.safeParse(await answered.clone().json());

      if (thumbnails.success) {
        peerClaims.claim('trickplay', thumbnails.data.id, who.serverId, who.title);
      }
    }

    if (stopped !== undefined) {
      const watcher = viewerOf(who.serverId, stopped);

      peerClaims.release('session', stopped, who.serverId);
      presence.stopPlayback(watcher);
      presence.disconnect(watcher, watcher);
      asking.delete(stopped);
    }

    const passedBack = new Headers(answered.headers);

    passedBack.delete('set-cookie');

    return new Response(answered.body, { status: answered.status, headers: passedBack });
  });

  app.openapi(readSharingRoute, async (context) => {
    const refusal = await keeper(context.req.raw.headers);

    if (refusal !== null) {
      return context.json(refusal.body, refusal.status);
    }

    const sharing = await linkSharing.sharingOf(context.req.valid('param').id);

    return sharing === null
      ? context.json(refuse('error.linking.noSuchServer'), 404)
      : context.json(sharing, 200);
  });

  app.openapi(changeSharingRoute, async (context) => {
    const refusal = await keeper(context.req.raw.headers);

    if (refusal !== null) {
      return context.json(refusal.body, refusal.status);
    }

    const changed = await linkSharing.changeSharing(
      context.req.valid('param').id,
      context.req.valid('json'),
    );

    if (changed.kind === 'noSuchLibrary') {
      return context.json(refuse('error.common.noSuchLibrary'), 400);
    }

    return changed.kind === 'noSuchServer'
      ? context.json(refuse('error.linking.noSuchServer'), 404)
      : context.json(changed.sharing, 200);
  });

  app.openapi(remotePeopleRoute, async (context) => {
    const refusal = await keeper(context.req.raw.headers);

    if (refusal !== null) {
      return context.json(refusal.body, refusal.status);
    }

    const people = await linkSharing.people(context.req.valid('param').id);

    return people === null
      ? context.json(refuse('error.linking.noSuchServer'), 404)
      : context.json({ people }, 200);
  });

  app.openapi(blockPersonRoute, async (context) => {
    const refusal = await keeper(context.req.raw.headers);

    if (refusal !== null) {
      return context.json(refusal.body, refusal.status);
    }

    const { id, personId } = context.req.valid('param');
    const person = await linkSharing.block(id, personId, true);

    return person === null
      ? context.json(refuse('error.linking.noSuchPerson'), 404)
      : context.json(person, 200);
  });

  app.openapi(unblockPersonRoute, async (context) => {
    const refusal = await keeper(context.req.raw.headers);

    if (refusal !== null) {
      return context.json(refusal.body, refusal.status);
    }

    const { id, personId } = context.req.valid('param');
    const person = await linkSharing.block(id, personId, false);

    return person === null
      ? context.json(refuse('error.linking.noSuchPerson'), 404)
      : context.json(person, 200);
  });

  app.openapi(activityRoute, async (context) => {
    const refusal = await keeper(context.req.raw.headers);

    if (refusal !== null) {
      return context.json(refusal.body, refusal.status);
    }

    const entries = await linkSharing.activity(context.req.valid('param').id);

    return entries === null
      ? context.json(refuse('error.linking.noSuchServer'), 404)
      : context.json({ entries }, 200);
  });

  app.openapi(theirLibrariesRoute, async (context) => {
    const refusal = await keeper(context.req.raw.headers);

    if (refusal !== null) {
      return context.json(refusal.body, refusal.status);
    }

    const theirs = await linkSharing.theirLibraries(context.req.valid('param').id);

    return theirs === null
      ? context.json(refuse('error.linking.noSuchServer'), 404)
      : context.json(theirs, 200);
  });

  app.openapi(chooseTheirLibraryRoute, async (context) => {
    const refusal = await keeper(context.req.raw.headers);

    if (refusal !== null) {
      return context.json(refusal.body, refusal.status);
    }

    const { id, libraryId } = context.req.valid('param');
    const { isTaken } = context.req.valid('json');

    return (await linkSharing.chooseTheirLibrary(id, libraryId, isTaken))
      ? context.json({ isTaken }, 200)
      : context.json(refuse('error.linking.noSuchServer'), 404);
  });

  app.openapi(facesRoute, async (context) => {
    if ((await readAccount(context.req.raw.headers)) === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const { servers } = await linking.linking();

    return context.json(
      {
        servers: servers
          .filter((server) => server.state === 'linked')
          .map((server) => ({
            id: server.id,
            name: server.name,
            colour: server.colour,
            isReachable: isLinkedServerReachable(server.id),
            takesRequests: linkedServerTakesRequests(server.id),
          })),
      },
      200,
    );
  });

  app.openapi(syncRoute, async (context) => {
    const refusal = await keeper(context.req.raw.headers);

    if (refusal !== null) {
      return context.json(refusal.body, refusal.status);
    }

    const synced = await syncLinkedServer(context.req.valid('param').id);

    return synced === null
      ? context.json(refuse('error.linking.thatServerCouldNotBeReached'), 404)
      : context.json(
          { libraries: synced.libraries, kept: synced.kept, forgotten: synced.forgotten },
          200,
        );
  });

  app.openapi(theirActivityRoute, async (context) => {
    const refusal = await keeper(context.req.raw.headers);

    if (refusal !== null) {
      return context.json(refusal.body, refusal.status);
    }

    const theirs = await linkSharing.theirActivity(context.req.valid('param').id);

    return theirs === null
      ? context.json(refuse('error.linking.noSuchServer'), 404)
      : context.json(theirs, 200);
  });
};

export { serveLinkSharing };
