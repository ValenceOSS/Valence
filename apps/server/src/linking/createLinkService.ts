import { PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import {
  LinkAddressSchema,
  LINK_PROTOCOL,
  PublicServerKeySchema,
} from '@ValenceContracts/schemas/LinkedServer';
import { hashShareToken, makeShareToken } from '@ValenceServer/sharing/shareToken';
import { createLinkTokenReader } from './createLinkTokenReader';
import { fingerprintOf } from './fingerprintOf';
import { makePseudonymSecret } from './makePseudonymSecret';
import { makeServerKey } from './makeServerKey';
import { pseudonymOf } from './pseudonymOf';
import { readLinkInvite } from './readLinkInvite';
import { signLinkToken } from './signLinkToken';
import { writeLinkInvite } from './writeLinkInvite';
import type { LinkIdentity, LinkState, LinkedServer } from '@ValenceContracts/schemas/LinkedServer';
import type { LinkSettings } from './LinkSettings';
import type { LinkService } from './LinkService';
import type { LinkStore, NewLinkedServer, StoredLinkedServer } from './LinkStore';
import type { LinkTokenPerson } from './LinkTokenPerson';
import type { PeerClient } from './createPeerClient';

const INVITE_LASTS_MS = 24 * 60 * 60 * 1000;

const DEFAULT_COLOUR = PROFILE_COLOURS[3];

const GONE_STATES: readonly LinkState[] = ['refused', 'unlinkedByThem', 'unlinked'];

const THEIR_STATE: Record<LinkState, LinkState> = {
  awaitingUs: 'awaitingThem',
  awaitingThem: 'awaitingUs',
  linked: 'linked',
  refused: 'refused',
  unlinkedByThem: 'unlinkedByThem',
  unlinked: 'unlinkedByThem',
};

type LinkServiceOptions = {
  store: LinkStore;
  settings: { read: () => Promise<LinkSettings>; write: (next: LinkSettings) => Promise<void> };
  address: string;
  defaultName: string;
  peers: PeerClient;
  now?: () => Date;
};

/**
 * What another server is shown of a linked one: everything but its key and the id it was paired
 * under, which are this server's business.
 *
 * @param server - The server as stored.
 * @returns The server as the admin sees it.
 */
const shownOf = (server: StoredLinkedServer): LinkedServer => ({
  id: server.id,
  name: server.name,
  colour: server.colour,
  address: server.address,
  fingerprint: server.fingerprint,
  state: server.state,
  createdAt: server.createdAt,
  linkedAt: server.linkedAt,
  lastSeenAt: server.lastSeenAt,
  pictureAt: server.pictureAt,
});

/**
 * Links this server with other Valence servers, one invite at a time: this server's own identity
 * and key, the invites its admin hands out, using an invite another admin handed this one, the
 * other side of that from the server that made the invite, approving or refusing a request, asking
 * whether one has been approved, and unlinking.
 *
 * Pairing grants nothing on its own. A link only says two servers know each other's keys and that
 * both admins agreed; what each shares with the other is chosen afterwards.
 *
 * Unlinking a linked server keeps it, marked unlinked, with everything kept from it, so what people
 * here watched and rated of it comes back if the two link again — which picks the same record up
 * rather than starting another. Only forgetting a server that is no longer linked removes it.
 *
 * @param store - Where linked servers and invites are kept.
 * @param settings - Where this server's key, name, colour and address are kept.
 * @param address - Where this server is reached, until its admin says otherwise.
 * @param defaultName - What this server is called, until its admin names it.
 * @param peers - How this server talks to the others.
 * @param now - The clock.
 * @returns The service.
 */
const createLinkService = ({
  store,
  settings,
  address,
  defaultName,
  peers,
  now = () => new Date(),
}: LinkServiceOptions): LinkService => {
  let making: Promise<LinkSettings> | null = null;

  const keys = async (): Promise<LinkSettings> => {
    const held = await settings.read();

    if (held.publicKey !== '' && held.privateKey !== '' && held.pseudonymSecret !== '') {
      return held;
    }

    making ??= (async () => {
      const made = {
        ...held,
        ...(held.publicKey === '' || held.privateKey === '' ? makeServerKey() : {}),
        ...(held.pseudonymSecret === '' ? { pseudonymSecret: makePseudonymSecret() } : {}),
      };

      await settings.write(made);

      return made;
    })().finally(() => {
      making = null;
    });

    return making;
  };

  const identity = async (): Promise<LinkIdentity> => {
    const held = await keys();
    const publicKey = PublicServerKeySchema.parse(JSON.parse(held.publicKey));
    const ownAddress = LinkAddressSchema.safeParse(held.address === '' ? address : held.address);

    return {
      name: held.name === '' ? defaultName : held.name,
      colour: held.colour === '' ? DEFAULT_COLOUR : held.colour,
      address: ownAddress.success ? ownAddress.data : address,
      protocols: [LINK_PROTOCOL],
      publicKey,
      fingerprint: fingerprintOf(publicKey),
      dropsRequestsElsewhere: held.dropsRequestsElsewhere,
      pictureAt: held.pictureAt === '' ? null : held.pictureAt,
    };
  };

  const readToken = createLinkTokenReader({
    me: async () => (await identity()).fingerprint,
    keyOf: async (fingerprint) =>
      (await store.readServerByFingerprint(fingerprint))?.publicKey ?? null,
    now: () => now().getTime(),
  });

  const tokenFor = async (server: StoredLinkedServer, person?: LinkTokenPerson) =>
    signLinkToken({
      from: (await identity()).fingerprint,
      to: server.fingerprint,
      privateKey: (await keys()).privateKey,
      ...(person === undefined ? {} : { person }),
    });

  const knownAs = async (fingerprint: string) => {
    const known = await store.readServerByFingerprint(fingerprint);

    if (known === null) {
      return { kind: 'new' } as const;
    }

    return GONE_STATES.includes(known.state)
      ? ({ kind: 'gone', id: known.id } as const)
      : ({ kind: 'taken' } as const);
  };

  const keepServer = async (
    known: Awaited<ReturnType<typeof knownAs>>,
    server: NewLinkedServer,
  ): Promise<StoredLinkedServer> => {
    if (known.kind === 'gone') {
      const revived = await store.changeServer(known.id, {
        name: server.name,
        colour: server.colour,
        address: server.address,
        state: server.state,
        theirPairingId: server.theirPairingId,
        linkedAt: server.state === 'linked' ? now() : null,
      });

      if (revived !== null) {
        return revived;
      }
    }

    return store.addServer(server);
  };

  const settle = async (id: string, from: LinkState, to: LinkState) => {
    const server = await store.readServer(id);

    if (server?.state !== from) {
      return server === null ? null : shownOf(server);
    }

    const changed = await store.changeServer(id, {
      state: to,
      ...(to === 'linked' ? { linkedAt: now() } : {}),
    });

    return changed === null ? null : shownOf(changed);
  };

  return {
    identity,

    readToken,

    signFor: async (id, person) => {
      const server = await store.readServer(id);

      return server?.state === 'linked'
        ? { address: server.address, token: await tokenFor(server, person) }
        : null;
    },

    pseudonymFor: async (id, profileId) =>
      pseudonymOf((await keys()).pseudonymSecret, id, profileId),

    publicIdentity: async () => {
      const me = await identity();

      return {
        name: me.name,
        colour: me.colour,
        protocols: me.protocols,
        publicKey: me.publicKey,
        fingerprint: me.fingerprint,
        pictureAt: me.pictureAt,
      };
    },

    changeIdentity: async (change) => {
      const held = await keys();

      await settings.write({
        ...held,
        ...(change.name === undefined ? {} : { name: change.name }),
        ...(change.colour === undefined ? {} : { colour: change.colour }),
        ...(change.address === undefined ? {} : { address: change.address }),
        ...(change.dropsRequestsElsewhere === undefined
          ? {}
          : { dropsRequestsElsewhere: change.dropsRequestsElsewhere }),
      });

      return identity();
    },

    changePicture: async (pictureAt) => {
      await settings.write({ ...(await keys()), pictureAt: pictureAt ?? '' });

      return identity();
    },

    linking: async () => ({
      identity: await identity(),
      invites: await store.listInvites(now()),
      servers: (await store.listServers()).map(shownOf),
    }),

    makeInvite: async () => {
      const me = await identity();
      const code = makeShareToken();
      const made = await store.addInvite(
        hashShareToken(code),
        new Date(now().getTime() + INVITE_LASTS_MS),
      );

      return {
        ...made,
        invite: writeLinkInvite({ v: 1, address: me.address, code, fingerprint: me.fingerprint }),
      };
    },

    withdrawInvite: (id) => store.withdrawInvite(id),

    useInvite: async (invite) => {
      const contents = readLinkInvite(invite);

      if (contents === null) {
        return { kind: 'refused', why: 'notAnInvite' };
      }

      const me = await identity();

      if (contents.fingerprint === me.fingerprint) {
        return { kind: 'refused', why: 'itself' };
      }

      const known = await knownAs(contents.fingerprint);

      if (known.kind === 'taken') {
        return { kind: 'refused', why: 'alreadyLinked' };
      }

      const theirs = await peers.identityAt(contents.address);

      if (theirs === null) {
        return { kind: 'refused', why: 'unreachable' };
      }

      if (fingerprintOf(theirs.publicKey) !== contents.fingerprint) {
        return { kind: 'refused', why: 'notTheServerThatInvited' };
      }

      const answered = await peers.pair(contents.address, {
        code: contents.code,
        server: { name: me.name, colour: me.colour, address: me.address, publicKey: me.publicKey },
      });

      if (answered.kind === 'unreachable') {
        return { kind: 'refused', why: 'unreachable' };
      }

      if (answered.kind === 'refused') {
        return {
          kind: 'refused',
          why:
            answered.code === 'error.linking.alreadyLinked'
              ? 'alreadyLinked'
              : answered.code === 'error.linking.thatInviteIsFromThisServer'
                ? 'itself'
                : 'inviteSpent',
        };
      }

      const added = await keepServer(known, {
        name: theirs.name,
        colour: theirs.colour,
        address: contents.address,
        publicKey: theirs.publicKey,
        fingerprint: contents.fingerprint,
        state: answered.answer.state === 'linked' ? 'linked' : 'awaitingThem',
        theirPairingId: answered.answer.pairingId,
      });
      const seen = await store.changeServer(added.id, { lastSeenAt: now() });

      return { kind: 'used', server: shownOf(seen ?? added) };
    },

    approve: (id) => settle(id, 'awaitingUs', 'linked'),

    refuse: (id) => settle(id, 'awaitingUs', 'refused'),

    check: async (id) => {
      const server = await store.readServer(id);

      if (server === null) {
        return null;
      }

      if (server.state !== 'awaitingThem' || server.theirPairingId === null) {
        return shownOf(server);
      }

      const answered = await peers.pairingState(
        server.address,
        server.theirPairingId,
        await tokenFor(server),
      );

      if (
        answered.kind === 'unreachable' ||
        (answered.kind === 'refused' && answered.code !== 'error.linking.notSignedByALinkedServer')
      ) {
        return shownOf(server);
      }

      const state: LinkState =
        answered.kind === 'refused' ? 'unlinkedByThem' : answered.answer.state;
      const changed = await store.changeServer(id, {
        lastSeenAt: now(),
        ...(state === 'awaitingThem' ? {} : { state }),
        ...(state === 'linked' ? { linkedAt: now() } : {}),
      });

      return changed === null ? null : shownOf(changed);
    },

    unlink: async (id) => {
      const server = await store.readServer(id);

      if (server === null) {
        return false;
      }

      if (server.state === 'linked' || server.state === 'awaitingThem') {
        await peers.tellUnlinked(server.address, await tokenFor(server));
      }

      if (server.state === 'linked') {
        return (await store.changeServer(id, { state: 'unlinked', linkedAt: null })) !== null;
      }

      return store.removeServer(id);
    },

    pair: async (request) => {
      const me = await identity();
      const fingerprint = fingerprintOf(request.server.publicKey);

      if (fingerprint === me.fingerprint) {
        return { kind: 'refused', why: 'itself' };
      }

      const known = await knownAs(fingerprint);

      if (known.kind === 'taken') {
        return { kind: 'refused', why: 'alreadyLinked' };
      }

      if (!(await store.spendInvite(hashShareToken(request.code), now()))) {
        return { kind: 'refused', why: 'inviteSpent' };
      }

      const added = await keepServer(known, {
        ...request.server,
        fingerprint,
        state: 'awaitingUs',
        theirPairingId: null,
      });
      const seen = await store.changeServer(added.id, { lastSeenAt: now() });

      return {
        kind: 'paired',
        answer: { pairingId: added.id, state: THEIR_STATE[(seen ?? added).state] },
      };
    },

    pairingState: async (pairingId, token) => {
      const signer = await readToken(token);
      const server = signer === null ? null : await store.readServer(pairingId);

      if (server === null || server.fingerprint !== signer?.from) {
        return null;
      }

      await store.changeServer(server.id, { lastSeenAt: now() });

      return { pairingId, state: THEIR_STATE[server.state] };
    },

    hearUnlinked: async (token) => {
      const signer = await readToken(token);
      const server = signer === null ? null : await store.readServerByFingerprint(signer.from);

      if (server === null) {
        return false;
      }

      await store.changeServer(server.id, { state: 'unlinkedByThem', linkedAt: null });

      return true;
    },
  };
};

export type { LinkServiceOptions };

export { createLinkService };
