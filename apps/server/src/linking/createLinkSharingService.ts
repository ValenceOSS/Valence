import { createRateLimiter } from './createRateLimiter';
import { federationReachOf } from './federationReachOf';
import { peerMayReach } from './peerMayReach';
import { signAsPerson } from './signAsPerson';
import type {
  FederationAction,
  FederationOutcome,
  SharedLibrary,
} from '@ValenceContracts/schemas/LinkSharing';
import type { LinkService } from './LinkService';
import type { Admission, LinkSharingService } from './LinkSharingService';
import type { LinkSharingStore } from './LinkSharingStore';
import type { LinkStore } from './LinkStore';
import type { PeerClient } from './createPeerClient';
import type { PeerItem } from './PeerItem';
import type { PeerSubject } from './FederationReach';
import type { ClaimedTitle, PeerClaims } from './createPeerClaims';

const MINUTE_MS = 60_000;

const MOST_FROM_A_SERVER = 1200;

const MOST_FROM_A_PERSON = 300;

const MOST_ACTIVITY = 200;

const BEARER = /^Bearer\s+(\S+)$/iu;

type LinkSharingServiceOptions = {
  linking: LinkService;
  links: LinkStore;
  sharing: LinkSharingStore;
  libraries: () => Promise<SharedLibrary[]>;
  subjectOf: (subject: PeerSubject) => Promise<PeerItem | null>;
  claims: PeerClaims;
  peers: PeerClient;
  warn?: (message: string) => void;
  limits?: { perServer: number; perPerson: number };
  now?: () => Date;
};

/**
 * What this server shares with the servers it is linked with, and the gate every request from one
 * of them passes through.
 *
 * Pairing grants nothing, so a server is shared nothing until its admin chooses libraries for it.
 * Every request a linked server makes is then checked, every time rather than once:
 *
 * 1. it is signed by a server this one is linked with, and meant for this one;
 * 2. it asks for something named as open to a linked server;
 * 3. the server and the person it asks for are within their rate;
 * 4. the person, where it names one, is not blocked;
 * 5. a catalogue, title, book, album or artist it asks about is in a library shared with that
 *    server and within its age, a session it asks about is one it started, and its record is read
 *    only where this server's admin shows it.
 *
 * What was asked for, and how it was answered, is kept in a record the admin can read, folded so a
 * film streamed piece by piece is one line rather than a thousand. The other server's admin can read
 * the part about their own people where this one's admin lets them.
 *
 * The same service is the other side of that, for this server's own admin: what a linked server
 * shares with this one, its record of this server's people, and signing as one of this server's
 * people, by a pseudonym that server cannot work back from, and by name only where the admin lets
 * names travel to it.
 *
 * @param linking - The link service, whose token reader and signer this shares.
 * @param links - Where linked servers are kept.
 * @param sharing - Where what each is shared, its people and its record are kept.
 * @param libraries - This server's libraries.
 * @param subjectOf - A title, book, album or artist, with the library it is in and its age.
 * @param claims - Which linked server started which session here.
 * @param peers - How this server talks to the others.
 * @param warn - Where a refusal worth an admin's attention is written, in English.
 * @param limits - How many requests a minute a server, and one of its people, may make.
 * @param now - The clock.
 * @returns The service.
 */
const createLinkSharingService = ({
  linking,
  links,
  sharing,
  libraries,
  subjectOf,
  claims,
  peers,
  warn = () => undefined,
  limits = { perServer: MOST_FROM_A_SERVER, perPerson: MOST_FROM_A_PERSON },
  now = () => new Date(),
}: LinkSharingServiceOptions): LinkSharingService => {
  const clock = () => now().getTime();
  const serverMayAsk = createRateLimiter({
    most: limits.perServer,
    withinMs: MINUTE_MS,
    now: clock,
  });
  const personMayAsk = createRateLimiter({
    most: limits.perPerson,
    withinMs: MINUTE_MS,
    now: clock,
  });

  const refused = (
    status: 401 | 403 | 429,
    code: Extract<Admission, { kind: 'refused' }>['code'],
  ): Admission => ({ kind: 'refused', status, code });

  const linkedServer = async (id: string) => {
    const server = await links.readServer(id);

    return server?.state === 'linked' ? server : null;
  };

  return {
    admit: async ({ method, path, authorization }) => {
      const reach = federationReachOf(method, path);

      if (reach.kind === 'pairing' || reach.kind === 'ticket') {
        return { kind: 'pairing' };
      }

      const token = BEARER.exec(authorization ?? '')?.[1];
      const signer = token === undefined ? null : await linking.readToken(token);
      const server = signer === null ? null : await links.readServerByFingerprint(signer.from);

      if (server?.state !== 'linked' || signer === null) {
        return refused(401, 'error.linking.notSignedByALinkedServer');
      }

      const at = now();

      if (server.lastSeenAt === null || at.getTime() - Date.parse(server.lastSeenAt) > MINUTE_MS) {
        await links.changeServer(server.id, { lastSeenAt: at });
      }

      if (reach.kind === 'refused') {
        warn(
          `linking: ${server.name} asked for ${method} ${path}, which is not open to a linked server`,
        );

        return refused(403, 'error.linking.thatIsNotSharedWithYourServer');
      }

      const person =
        signer.person === null
          ? null
          : await sharing.seePerson(server.id, signer.person.pseudonym, signer.person.name, at);
      const subject = reach.kind === 'subject' ? await subjectOf(reach.subject) : null;
      const claimed =
        reach.kind === 'claimed' ? claims.claimedBy(reach.claim, reach.id, server.id) : null;
      const title: ClaimedTitle =
        subject !== null
          ? { mediaId: subject.id, title: subject.title }
          : (claimed ?? { mediaId: null, title: null });
      const record = (action: FederationAction, outcome: FederationOutcome) =>
        sharing.record(
          {
            linkedServerId: server.id,
            remotePersonId: person?.id ?? null,
            action,
            mediaId: title.mediaId,
            mediaTitle: title.title,
            outcome,
          },
          at,
        );

      if (
        !serverMayAsk(server.id) ||
        (person !== null && !personMayAsk(`${server.id}:${person.id}`))
      ) {
        await record(reach.action, 'tooMany');
        warn(`linking: ${server.name} is asking too often, and was slowed down`);

        return refused(429, 'error.linking.yourServerIsAskingTooOften');
      }

      if (person !== null && person.blockedAt !== null) {
        await record(reach.action, 'blocked');

        return refused(403, 'error.linking.thisPersonMayNotWatchFromHere');
      }

      if (
        reach.action === 'activity' &&
        (await sharing.readSharing(server.id))?.showsActivity !== true
      ) {
        await record(reach.action, 'notShared');

        return refused(403, 'error.linking.thatServerDoesNotShowItsRecord');
      }

      const shared = await sharing.readSharing(server.id);

      if (reach.kind === 'catalogue' && shared?.libraryIds.includes(reach.libraryId) !== true) {
        await record(reach.action, 'notShared');

        return refused(403, 'error.linking.thatIsNotSharedWithYourServer');
      }

      if (reach.kind === 'subject') {
        const outcome =
          subject === null || shared === null ? 'notShared' : peerMayReach(shared, subject);

        if (outcome !== 'allowed') {
          await record(reach.action, outcome);

          return refused(403, 'error.linking.thatIsNotSharedWithYourServer');
        }
      }

      if (reach.kind === 'claimed' && claimed === null) {
        await record(reach.action, 'notShared');

        return refused(403, 'error.linking.thatIsNotSharedWithYourServer');
      }

      await record(reach.action, 'allowed');

      return {
        kind: 'admitted',
        serverId: server.id,
        personId: person?.id ?? null,
        action: reach.action,
        inner: reach.kind === 'subject' || reach.kind === 'claimed' ? reach.inner : null,
        libraryId: reach.kind === 'catalogue' ? reach.libraryId : null,
        title,
        serverName: server.name,
        personName: person?.name ?? null,
        sharing: shared,
      };
    },

    subjectOfTitle: (mediaId) => subjectOf({ kind: 'item', id: mediaId }),

    sharedWith: async (serverId) => {
      const shared = await sharing.readSharing(serverId);

      if (shared === null) {
        return [];
      }

      return (await libraries()).filter((library) => shared.libraryIds.includes(library.id));
    },

    activityFor: async (serverId, since) => {
      const shared = await sharing.readSharing(serverId);

      return shared?.showsActivity === true
        ? sharing.listActivity(serverId, {
            ...(since === undefined ? {} : { since }),
            limit: MOST_ACTIVITY,
          })
        : null;
    },

    sharingOf: (id) => sharing.readSharing(id),

    changeSharing: async (id, change) => {
      if (change.libraryIds !== undefined) {
        const known = new Set((await libraries()).map((library) => library.id));

        if (change.libraryIds.some((libraryId) => !known.has(libraryId))) {
          return { kind: 'noSuchLibrary' };
        }
      }

      const changed = await sharing.changeSharing(id, change);

      return changed === null ? { kind: 'noSuchServer' } : { kind: 'changed', sharing: changed };
    },

    people: async (id) => ((await links.readServer(id)) === null ? null : sharing.listPeople(id)),

    block: (id, personId, isBlocked) => sharing.blockPerson(id, personId, isBlocked ? now() : null),

    activity: async (id) =>
      (await links.readServer(id)) === null
        ? null
        : sharing.listActivity(id, { limit: MOST_ACTIVITY }),

    theirLibraries: async (id) => {
      if ((await links.readServer(id)) === null) {
        return null;
      }

      const signed = await linking.signFor(id);
      const answered = signed === null ? null : await peers.libraries(signed.address, signed.token);

      if (answered?.kind !== 'answered') {
        return { isReachable: false, libraries: [] };
      }

      const declined = new Set(await links.listDeclined(id));

      return {
        isReachable: true,
        libraries: answered.answer.libraries.map((library) => ({
          ...library,
          isTaken: !declined.has(library.id),
        })),
      };
    },

    chooseTheirLibrary: async (id, libraryId, isTaken) => {
      if ((await links.readServer(id)) === null) {
        return false;
      }

      await links.declineLibrary(id, libraryId, !isTaken);

      return true;
    },

    theirActivity: async (id) => {
      if ((await links.readServer(id)) === null) {
        return null;
      }

      const signed = await linking.signFor(id);
      const answered = signed === null ? null : await peers.activity(signed.address, signed.token);

      if (answered?.kind === 'answered') {
        return { standing: 'shown', entries: answered.answer };
      }

      return { standing: answered?.kind === 'refused' ? 'notShown' : 'unreachable', entries: [] };
    },

    askAs: async (id, person) =>
      (await linkedServer(id)) === null ? null : signAsPerson(linking, sharing, id, person),
  };
};

export type { LinkSharingServiceOptions };

export { createLinkSharingService };
