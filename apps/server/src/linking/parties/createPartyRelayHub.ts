import { PEER_MEMBER } from './PEER_MEMBER';
import { THEIR_OWN } from './THEIR_OWN';
import { FromServerSchema } from '@ValenceContracts/schemas/Realtime';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { FromServer } from '@ValenceContracts/schemas/Realtime';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type Heard = { connection: string; message: FromServer };

const MOST_HELD = 500;

/**
 * Where what a party here says to people watching from linked servers waits until their server
 * comes to hear it. Each such person is a member of the party under a name made from their server
 * and their connection there; when their server hears, its own people are named as its own again,
 * and everybody else is left as this server names them.
 *
 * @param now - The clock.
 * @returns The hub.
 */
const createPartyRelayHub = (now: () => number = Date.now) => {
  const held = new Map<string, Heard[]>();
  const waiting = new Map<string, () => void>();

  const memberOf = (serverId: string, connection: string) =>
    `${PEER_MEMBER}${serverId}~${connection}`;

  const readMember = (member: string) => {
    if (!member.startsWith(PEER_MEMBER)) {
      return null;
    }

    const [serverId, ...rest] = member.slice(PEER_MEMBER.length).split('~');

    return serverId === undefined || rest.length === 0
      ? null
      : { serverId, connection: rest.join('~') };
  };

  const asTheirs = (serverId: string, message: FromServer): FromServer =>
    FromServerSchema.parse(
      JsonValueSchema.parse(
        JSON.parse(JSON.stringify(message).replaceAll(`${PEER_MEMBER}${serverId}~`, THEIR_OWN)),
      ),
    );

  const keep = (member: string, message: FromServer) => {
    const peer = readMember(member);

    if (peer === null) {
      return;
    }

    const kept = held.get(peer.serverId) ?? [];

    kept.push({ connection: peer.connection, message: asTheirs(peer.serverId, message) });
    held.set(peer.serverId, kept.slice(-MOST_HELD));
    waiting.get(peer.serverId)?.();
  };

  return {
    memberOf,
    isPeer: (member: string) => member.startsWith(PEER_MEMBER),
    write: keep,
    tell: (members: readonly string[], payload: JsonValue) => {
      for (const member of members) {
        keep(member, { kind: 'event', topic: 'party', atMs: now(), folded: 0, payload });
      }
    },
    asOurs: (serverId: string, text: string) =>
      text.replaceAll(THEIR_OWN, `${PEER_MEMBER}${serverId}~`),
    hear: (serverId: string, waitMs: number): Promise<Heard[]> => {
      const take = () => {
        const kept = held.get(serverId) ?? [];

        held.delete(serverId);

        return kept;
      };

      if ((held.get(serverId) ?? []).length > 0) {
        return Promise.resolve(take());
      }

      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          waiting.delete(serverId);
          resolve(take());
        }, waitMs);

        waiting.set(serverId, () => {
          clearTimeout(timer);
          waiting.delete(serverId);
          resolve(take());
        });
      });
    },
  };
};

type PartyRelayHub = ReturnType<typeof createPartyRelayHub>;

export type { Heard, PartyRelayHub };

export { createPartyRelayHub };
