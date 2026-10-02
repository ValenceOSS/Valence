import { PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import {
  LinkAddressSchema,
  LINK_PROTOCOL,
  PublicServerKeySchema,
} from '@ValenceContracts/schemas/LinkedServer';
import { hashShareToken, makeShareToken } from '@ValenceServer/sharing/shareToken';
import { createLinkTokenReader } from './createLinkTokenReader';
import { fingerprintOf } from './fingerprintOf';
import { makeServerKey } from './makeServerKey';
import { readLinkInvite } from './readLinkInvite';
import { signLinkToken } from './signLinkToken';
import { writeLinkInvite } from './writeLinkInvite';
import type { LinkIdentity, LinkState, LinkedServer } from '@ValenceContracts/schemas/LinkedServer';
import type { LinkSettings } from './LinkSettings';
import type { LinkService } from './LinkService';
import type { LinkStore, StoredLinkedServer } from './LinkStore';
import type { PeerClient } from './createPeerClient';

const INVITE_LASTS_MS = 24 * 60 * 60 * 1000;

const DEFAULT_COLOUR = PROFILE_COLOURS[3];

const GONE_STATES: readonly LinkState[] = ['refused', 'unlinkedByThem'];

const THEIR_STATE: Record<LinkState, LinkState> = {
  awaitingUs: 'awaitingThem',
  awaitingThem: 'awaitingUs',
  linked: 'linked',
  refused: 'refused',
  unlinkedByThem: 'unlinkedByThem',
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
  const keys = async (): Promise<LinkSettings> => {
    const held = await settings.read();

    if (held.publicKey !== '' && held.privateKey !== '') {
      return held;
    }

    const made = { ...held, ...makeServerKey() };

    await settings.write(made);

    return made;
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
    };
  };

  const readToken = createLinkTokenReader({
    me: async () => (await identity()).fingerprint,
    keyOf: async (fingerprint) =>
      (await store.readServerByFingerprint(fingerprint))?.publicKey ?? null,
    now: () => now().getTime(),
  });

  const tokenFor = async (server: StoredLinkedServer) =>
    signLinkToken({
      from: (await identity()).fingerprint,
      to: server.fingerprint,
      privateKey: (await keys()).privateKey,
    });

  const forgetGone = async (fingerprint: string): Promise<'clear' | 'taken'> => {
    const known = await store.readServerByFingerprint(fingerprint);

    if (known === null) {
      return 'clear';
    }

    if (!GONE_STATES.includes(known.state)) {
      return 'taken';
    }

    await store.removeServer(known.id);

    return 'clear';
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

    publicIdentity: async () => {
      const me = await identity();

      return {
        name: me.name,
        colour: me.colour,
        protocols: me.protocols,
        publicKey: me.publicKey,
        fingerprint: me.fingerprint,
      };
    },

    changeIdentity: async (change) => {
      const held = await keys();

      await settings.write({
        ...held,
        ...(change.name === undefined ? {} : { name: change.name }),
        ...(change.colour === undefined ? {} : { colour: change.colour }),
        ...(change.address === undefined ? {} : { address: change.address }),
      });

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

      if ((await forgetGone(contents.fingerprint)) === 'taken') {
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
          why: answered.code.endsWith('alreadyLinked')
            ? 'alreadyLinked'
            : answered.code.endsWith('itself')
              ? 'itself'
              : 'inviteSpent',
        };
      }

      const added = await store.addServer({
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

      if (answered.kind === 'unreachable') {
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

      return store.removeServer(id);
    },

    pair: async (request) => {
      const me = await identity();
      const fingerprint = fingerprintOf(request.server.publicKey);

      if (fingerprint === me.fingerprint) {
        return { kind: 'refused', why: 'itself' };
      }

      if ((await forgetGone(fingerprint)) === 'taken') {
        return { kind: 'refused', why: 'alreadyLinked' };
      }

      if (!(await store.spendInvite(hashShareToken(request.code), now()))) {
        return { kind: 'refused', why: 'inviteSpent' };
      }

      const added = await store.addServer({
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
      const from = await readToken(token);
      const server = from === null ? null : await store.readServer(pairingId);

      if (server === null || server.fingerprint !== from) {
        return null;
      }

      await store.changeServer(server.id, { lastSeenAt: now() });

      return { pairingId, state: THEIR_STATE[server.state] };
    },

    hearUnlinked: async (token) => {
      const from = await readToken(token);
      const server = from === null ? null : await store.readServerByFingerprint(from);

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
