import { describe, expect, it, vi } from 'vitest';
import { aLinkedAskerAnswering } from '@ValenceServer/testing/aLinkedAskerAnswering';
import { localIdOf } from '@ValenceServer/linking/catalogue/localIdOf';
import { createPersonScope } from '@ValenceServer/linking/content/createPersonScope';
import { createPartyRelayClient } from './createPartyRelayClient';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { Asking } from '@ValenceServer/linking/content/createLinkedAsker';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { FromServer } from '@ValenceContracts/schemas/Realtime';

const FILMS = '00000000-0000-4000-8000-0000000000f1';

const PARTY = `linked~${FILMS}~p1`;

const SAM = { profileId: 'sam', name: 'Sam' };

const JOIN = { kind: 'partyJoin', partyId: PARTY } as const;

/**
 * What a request to Films said, read back.
 *
 * @param asking - The request.
 * @returns What it carried.
 */
const bodyOf = (asking: Asking | undefined): JsonValue =>
  asking?.body === undefined
    ? null
    : JsonValueSchema.parse(JSON.parse(new TextDecoder().decode(asking.body)));

/**
 * A relay onto Films, which hears the party once — a message naming the party, a title and Sam as
 * Films names them — and then cannot be heard again.
 *
 * @param says - How Films answers what is said to it.
 * @returns The relay, and what Films was asked.
 */
const relaying = (says: () => Response | null = () => new Response(null, { status: 204 })) => {
  let heard = 0;
  const asker = aLinkedAskerAnswering((_, route) => {
    if (!route.startsWith('/parties/hear')) {
      return says();
    }

    heard += 1;

    return heard > 1
      ? null
      : Response.json({
          serverAtMs: Date.now(),
          heard: [
            {
              connection: 'tab-1',
              message: {
                kind: 'event',
                topic: 'party',
                atMs: 1000,
                folded: 0,
                payload: { party: { id: 'p1' }, mediaId: 'remote', members: ['here~tab-1'] },
              },
            },
          ],
        });
  });
  const relay = createPartyRelayClient({
    asker,
    people: createPersonScope(),
    linkedTitleOf: (mediaId) =>
      Promise.resolve(mediaId === 'theirs' ? { serverId: FILMS, remoteId: 'remote' } : null),
  });

  return { relay, asker };
};

describe('createPartyRelayClient', () => {
  it('takes a join to a party held on a linked server, and nothing about one held here', () => {
    const { relay } = relaying();

    expect(relay.takes('tab-1', JOIN)).toBe(true);
    expect(relay.takes('tab-1', { kind: 'partyJoin', partyId: 'held-here' })).toBe(false);
    expect(relay.takes('tab-1', { kind: 'partyLeave' })).toBe(false);
  });

  it('joins as the person, naming the party as the linked server does', async () => {
    const { relay, asker } = relaying();

    await relay.say('tab-1', SAM, vi.fn(), JOIN);

    const said = asker.asked.find((one) => one.route === '/parties/say');

    expect(bodyOf(said?.asking)).toEqual({
      connection: 'tab-1',
      message: { kind: 'partyJoin', partyId: 'p1' },
    });
    expect(relay.takes('tab-1', { kind: 'partyLeave' })).toBe(true);
    relay.forget('tab-1');
  });

  it('hands on what the party says as if it were held here', async () => {
    const { relay } = relaying();
    const write = vi.fn<(message: FromServer) => void>();

    await relay.say('tab-1', SAM, write, JOIN);

    await vi.waitFor(() => {
      expect(write).toHaveBeenCalled();
    });

    expect(write.mock.calls[0]?.[0]).toMatchObject({
      payload: { party: { id: PARTY }, mediaId: localIdOf(FILMS, 'remote'), members: ['tab-1'] },
    });
    relay.forget('tab-1');
  });

  it('asks a party there to play a title by what that server calls it, and only one of its own', async () => {
    const { relay, asker } = relaying();
    const write = vi.fn<(message: FromServer) => void>();

    await relay.say('tab-1', SAM, write, JOIN);
    await relay.say('tab-1', SAM, write, {
      kind: 'partyCommand',
      command: { kind: 'changeWhatIsPlaying', mediaId: 'theirs' },
    });
    await relay.say('tab-1', SAM, write, {
      kind: 'partyCommand',
      command: { kind: 'changeWhatIsPlaying', mediaId: 'mine' },
    });

    const said = asker.asked.filter((one) => one.route === '/parties/say');

    expect(bodyOf(said[1]?.asking)).toMatchObject({
      message: { command: { kind: 'changeWhatIsPlaying', mediaId: 'remote' } },
    });
    expect(said).toHaveLength(2);
    expect(write.mock.calls.at(-1)?.[0]).toMatchObject({
      kind: 'refused',
      why: { code: 'common.thatPartyIsNotRunning' },
    });
    relay.forget('tab-1');
  });

  it('asks people along only from the server holding the party', async () => {
    const { relay } = relaying();
    const write = vi.fn<(message: FromServer) => void>();

    await relay.say('tab-1', SAM, vi.fn(), JOIN);
    await relay.say('tab-1', SAM, write, { kind: 'partyInvite', profileId: 'dan' });

    expect(write.mock.calls.at(-1)?.[0]).toMatchObject({
      kind: 'refused',
      why: { code: 'error.linking.askAlongFromTheServerHoldingIt' },
    });
    relay.forget('tab-1');
  });

  it('says so where the linked server cannot be reached', async () => {
    const { relay } = relaying(() => null);
    const write = vi.fn<(message: FromServer) => void>();

    await relay.say('tab-1', SAM, write, JOIN);

    expect(write.mock.calls.at(-1)?.[0]).toMatchObject({
      kind: 'refused',
      why: { code: 'error.linking.thatServerCouldNotBeReached' },
    });
    relay.forget('tab-1');
  });

  it('tells the linked server somebody has left, once', async () => {
    const { relay, asker } = relaying();

    await relay.say('tab-1', SAM, vi.fn(), JOIN);
    relay.forget('tab-1');
    relay.forget('tab-1');

    await vi.waitFor(() => {
      expect(
        asker.asked.filter(
          (one) =>
            bodyOf(one.asking) !== null &&
            JSON.stringify(bodyOf(one.asking)).includes('partyLeave'),
        ),
      ).toHaveLength(1);
    });
  });
});
