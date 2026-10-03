import { z } from 'zod';
import { FromServerSchema } from '@ValenceContracts/schemas/Realtime';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { localIdOf } from '@ValenceServer/linking/catalogue/localIdOf';
import { LINKED_PARTY } from './LINKED_PARTY';
import { THEIR_OWN } from './THEIR_OWN';
import type { FromClient, FromServer } from '@ValenceContracts/schemas/Realtime';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { LinkPerson } from '@ValenceServer/linking/LinkPerson';
import type { LinkedAsker } from '@ValenceServer/linking/content/createLinkedAsker';
import type { LinkedTitle } from '@ValenceServer/linking/content/createLinkedPlayback';
import type { PersonScope } from '@ValenceServer/linking/content/createPersonScope';
import { saying } from '@ValenceI18n/saying';

const HEARS_FOR_SECONDS = 20;

const RESTS_AFTER_FAILING_MS = 3000;

const HeardSchema = z.object({
  heard: z.array(z.object({ connection: z.string(), message: FromServerSchema })),
  serverAtMs: z.number(),
});

type Relaying = {
  serverId: string;
  person: LinkPerson | null;
  write: (message: FromServer) => void;
};

/**
 * A party held on a linked server, by the name this server gives it.
 *
 * @param serverId - The linked server.
 * @param partyId - What it calls the party.
 * @returns The name here.
 */
const linkedPartyOf = (serverId: string, partyId: string) =>
  `${LINKED_PARTY}${serverId}~${partyId}`;

/**
 * Reads a party's name here as the linked server it is held on and what it calls it.
 *
 * @param name - The name here.
 * @returns The server and party, or nothing where the party is held here.
 */
const readLinkedParty = (name: string) => {
  if (!name.startsWith(LINKED_PARTY)) {
    return null;
  }

  const [serverId, ...rest] = name.slice(LINKED_PARTY.length).split('~');

  return serverId === undefined || rest.length === 0 ? null : { serverId, partyId: rest.join('~') };
};

/**
 * What a linked server's party said, as this server's people read it: its titles and the party
 * named as this server names them, every time moved onto this server's clock, which is the one its
 * people keep in step with, and this server's own people named as they are known here.
 *
 * @param value - What was said, or part of it.
 * @param serverId - The linked server.
 * @param offsetMs - How far this server's clock is ahead of that one's.
 * @param key - The name the value was found under.
 * @returns It, as this server's people read it.
 */
const asHeardHere = (
  value: JsonValue,
  serverId: string,
  offsetMs: number,
  key: string | null = null,
): JsonValue => {
  if (typeof value === 'string') {
    if (key === 'mediaId') {
      return localIdOf(serverId, value);
    }

    if (key === 'partyId') {
      return linkedPartyOf(serverId, value);
    }

    return value.startsWith(THEIR_OWN) ? value.slice(THEIR_OWN.length) : value;
  }

  if (typeof value === 'number') {
    return key !== null && key.endsWith('AtMs') ? Math.round(value + offsetMs) : value;
  }

  if (Array.isArray(value)) {
    return value.map((one) => asHeardHere(one, serverId, offsetMs));
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([name, inner]) => [
      name,
      key === 'party' && name === 'id' && typeof inner === 'string'
        ? linkedPartyOf(serverId, inner)
        : asHeardHere(inner, serverId, offsetMs, name),
    ]),
  );
};

/**
 * This server's people in a watch party held on a linked server: what they say to the party is
 * sent on to that server, as them, and what the party says is heard back from it and handed to them
 * as if the party were held here — so a player keeps in step with a room on another server without
 * knowing it is anywhere else. A party is held on one server only; this one only passes it along.
 *
 * @param asker - How a linked server is asked.
 * @param people - Who a request is for.
 * @param linkedTitleOf - Which linked server a title is from and what it calls it.
 * @param warn - Where to say that a linked party could not be reached, in English.
 * @returns The relay.
 */
const createPartyRelayClient = ({
  asker,
  people,
  linkedTitleOf,
  warn = () => undefined,
}: {
  asker: LinkedAsker;
  people: PersonScope;
  linkedTitleOf: (mediaId: string) => Promise<LinkedTitle | null>;
  warn?: (message: string) => void;
}) => {
  const relaying = new Map<string, Relaying>();
  const hearing = new Set<string>();
  const offsets = new Map<string, number>();

  const hear = async (serverId: string) => {
    if (hearing.has(serverId)) {
      return;
    }

    hearing.add(serverId);

    while ([...relaying.values()].some((one) => one.serverId === serverId)) {
      const sentAtMs = Date.now();
      const answered = await asker.ask(
        serverId,
        `/parties/hear?wait=${HEARS_FOR_SECONDS.toString()}`,
      );
      const read =
        answered?.ok === true
          ? HeardSchema.safeParse(await answered.json().catch(() => null))
          : null;

      if (read?.success !== true) {
        warn(`linking: a watch party on a linked server could not be heard`);
        await new Promise((rest) => setTimeout(rest, RESTS_AFTER_FAILING_MS));

        continue;
      }

      const offset = (sentAtMs + Date.now()) / 2 - read.data.serverAtMs;

      offsets.set(serverId, offset);

      for (const { connection, message } of read.data.heard) {
        const here = relaying.get(connection);
        const heard = FromServerSchema.safeParse(
          asHeardHere(JsonValueSchema.parse(JSON.parse(JSON.stringify(message))), serverId, offset),
        );

        if (here !== undefined && heard.success) {
          here.write(heard.data);
        }
      }
    }

    hearing.delete(serverId);
  };

  const asSaidThere = async (message: FromClient): Promise<FromClient | null> => {
    if (message.kind === 'partyJoin') {
      const linked = readLinkedParty(message.partyId);

      return linked === null ? null : { ...message, partyId: linked.partyId };
    }

    if (message.kind === 'partyCommand' && message.command.kind === 'changeWhatIsPlaying') {
      const linked = await linkedTitleOf(message.command.mediaId);

      return linked === null
        ? null
        : { ...message, command: { ...message.command, mediaId: linked.remoteId } };
    }

    if (message.kind === 'partySetRole' || message.kind === 'partyRemove') {
      return relaying.has(message.connectionId)
        ? { ...message, connectionId: `${THEIR_OWN}${message.connectionId}` }
        : message;
    }

    return message;
  };

  const leave = (connectionId: string) => {
    const was = relaying.get(connectionId);

    if (was === undefined) {
      return;
    }

    relaying.delete(connectionId);
    void people.runAs(
      () => Promise.resolve(was.person),
      () =>
        asker.ask(was.serverId, '/parties/say', {
          method: 'POST',
          headers: new Headers({ 'content-type': 'application/json' }),
          body: new TextEncoder().encode(
            JSON.stringify({ connection: connectionId, message: { kind: 'partyLeave' } }),
          ).buffer,
        }),
    );
  };

  return {
    takes: (connectionId: string, message: FromClient) =>
      relaying.has(connectionId) ||
      (message.kind === 'partyJoin' && readLinkedParty(message.partyId) !== null),

    say: async (
      connectionId: string,
      person: LinkPerson | null,
      write: (message: FromServer) => void,
      message: FromClient,
    ) => {
      const joining = message.kind === 'partyJoin' ? readLinkedParty(message.partyId) : null;
      const held = relaying.get(connectionId);

      if (joining !== null && held !== undefined && held.serverId !== joining.serverId) {
        leave(connectionId);
      }

      const serverId = joining?.serverId ?? held?.serverId;

      if (serverId === undefined) {
        return;
      }

      if (message.kind === 'partyOpen' || message.kind === 'partyInvite') {
        write({ kind: 'refused', why: saying('error.linking.askAlongFromTheServerHoldingIt') });

        return;
      }

      const said = await asSaidThere(message);

      if (said === null) {
        write({ kind: 'refused', why: saying('common.thatPartyIsNotRunning') });

        return;
      }

      relaying.set(connectionId, { serverId, person, write });

      if (message.kind === 'partyLeave') {
        leave(connectionId);

        return;
      }

      void hear(serverId);

      const answered = await people.runAs(
        () => Promise.resolve(person),
        () =>
          asker.ask(serverId, '/parties/say', {
            method: 'POST',
            headers: new Headers({ 'content-type': 'application/json' }),
            body: new TextEncoder().encode(
              JSON.stringify({ connection: connectionId, message: said }),
            ).buffer,
          }),
      );

      if (answered === null || !answered.ok) {
        write({ kind: 'refused', why: saying('error.linking.thatServerCouldNotBeReached') });
      }
    },

    forget: leave,
  };
};

type PartyRelayClient = ReturnType<typeof createPartyRelayClient>;

export type { PartyRelayClient };

export { createPartyRelayClient };
