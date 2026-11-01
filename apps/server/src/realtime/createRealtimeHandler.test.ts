import { describe, expect, it } from 'vitest';
import { createRealtimeHandler } from './createRealtimeHandler';
import { createRealtimeRegistry } from './createRealtimeRegistry';
import { createEntitlements } from './createEntitlements';
import { FromServerSchema } from '@ValenceContracts/schemas/Realtime';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { PresenceBinding, PresenceControl } from './createRealtimeHandler';
import type { Schedule } from './createCoalescer';
import type { FromServer } from '@ValenceContracts/schemas/Realtime';
import type { Permission } from '@ValenceContracts/schemas/Permission';
import type { ClientKind } from '@ValenceContracts/schemas/ClientKind';
import { createPartyRegistry } from '@ValenceServer/parties/createPartyRegistry';
import type { SeenDevice } from '@ValenceServer/devices/DeviceNotes';

const createWorld = (
  granted: Permission[] = [],
  renames: ReadonlyMap<string, string> = new Map(),
) => {
  const due: (() => void)[] = [];

  const schedule: Schedule = (run) => {
    due.push(run);

    return () => {
      const at = due.indexOf(run);

      if (at >= 0) {
        due.splice(at, 1);
      }
    };
  };

  const registry = createRealtimeRegistry({
    entitlements: createEntitlements({
      resolve: () => Promise.resolve(new Set(granted)),
      now: () => 0,
      ttlMs: 0,
    }),
    now: () => 1000,
    schedule,
    windowMs: 50,
  });

  const presenceCalls: {
    connected: string[];
    disconnected: string[];
    labels: string[];
    clientLabels: string[];
    addresses: (string | null)[];
    kinds: (ClientKind | null)[];
    renamed: (string | null)[];
    noted: { sessionId: string; seen: SeenDevice }[];
    active: { sessionId: string; at: Date }[];
  } = {
    connected: [],
    disconnected: [],
    labels: [],
    clientLabels: [],
    addresses: [],
    kinds: [],
    renamed: [],
    noted: [],
    active: [],
  };

  let announce: ((event: PresenceControl) => void) | null = null;

  const presence: PresenceBinding = {
    connect: ({ clientId, deviceLabel, clientLabel, clientKind, address, renamed, send }) => {
      presenceCalls.connected.push(clientId);
      presenceCalls.labels.push(deviceLabel);
      presenceCalls.clientLabels.push(clientLabel);
      presenceCalls.renamed.push(renamed);
      presenceCalls.addresses.push(address);
      presenceCalls.kinds.push(clientKind);
      announce = send;

      return true;
    },
    disconnect: (clientId) => {
      presenceCalls.disconnected.push(clientId);
    },
    nameOf: () => Promise.resolve('Sam'),
    renamedDevice: (accountId, deviceId) =>
      Promise.resolve(renames.get(`${accountId}/${deviceId}`) ?? null),
    noteDevice: (sessionId, seen) => {
      presenceCalls.noted.push({ sessionId, seen });
    },
    noteActive: (sessionId, at) => {
      presenceCalls.active.push({ sessionId, at });
    },
  };

  let count = 0;
  const handler = createRealtimeHandler({
    registry,
    now: () => 1000,
    presence,
    newId: () => {
      count += 1;

      return `connection-${count.toString()}`;
    },
  });

  const sent: string[] = [];
  const socket = { send: (raw: string) => sent.push(raw) };

  const read = (): FromServer[] =>
    sent.map((raw) => FromServerSchema.parse(JsonValueSchema.parse(JSON.parse(raw))));

  return {
    registry,
    handler,
    socket,
    sent,
    read,
    presenceCalls,
    announce: (event: PresenceControl) => announce?.(event),
    tick: () => {
      for (const run of due.splice(0, due.length)) {
        run();
      }
    },
  };
};

describe('createRealtimeHandler', () => {
  it('registers the connection and greets it', () => {
    const world = createWorld();

    world.handler.open({ accountId: 'me', profileId: null }, world.socket);

    expect(world.registry.count()).toBe(1);
    expect(world.read()[0]?.kind).toBe('welcome');
  });

  it('subscribes to what a client asks for', async () => {
    const world = createWorld();
    const session = world.handler.open({ accountId: 'me', profileId: null }, world.socket);

    await session.receive(JSON.stringify({ kind: 'subscribe', topics: ['media'] }));

    expect(world.registry.topicsOf(session.id)).toStrictEqual(['media']);
  });

  it('tells a client plainly which topics it will never receive', async () => {
    const world = createWorld();
    const session = world.handler.open({ accountId: 'me', profileId: null }, world.socket);

    await session.receive(JSON.stringify({ kind: 'subscribe', topics: ['media', 'logs'] }));

    const answer = world.read().find((message) => message.kind === 'subscribed');

    expect(answer?.kind === 'subscribed' ? answer.refused : []).toStrictEqual(['logs']);
  });

  it('ignores a message that is not JSON at all, and stays open', async () => {
    const world = createWorld();
    const session = world.handler.open({ accountId: 'me', profileId: null }, world.socket);

    await session.receive('not json {{{');

    expect(world.registry.count()).toBe(1);
  });

  it('ignores a message of a kind it does not know rather than closing the feed', async () => {
    const world = createWorld();
    const session = world.handler.open({ accountId: 'me', profileId: null }, world.socket);

    await session.receive(JSON.stringify({ kind: 'from-a-newer-build', topics: ['media'] }));
    await session.receive(JSON.stringify({ kind: 'subscribe', topics: ['media'] }));

    expect(world.registry.topicsOf(session.id)).toStrictEqual(['media']);
  });

  it('ignores a subscribe naming a topic that does not exist', async () => {
    const world = createWorld();
    const session = world.handler.open({ accountId: 'me', profileId: null }, world.socket);

    await session.receive(JSON.stringify({ kind: 'subscribe', topics: ['everything'] }));

    expect(world.registry.topicsOf(session.id)).toStrictEqual([]);
  });

  it('withdraws a subscription on request', async () => {
    const world = createWorld();
    const session = world.handler.open({ accountId: 'me', profileId: null }, world.socket);

    await session.receive(JSON.stringify({ kind: 'subscribe', topics: ['media'] }));
    await session.receive(JSON.stringify({ kind: 'unsubscribe', topics: ['media'] }));

    expect(world.registry.topicsOf(session.id)).toStrictEqual([]);
  });

  it('stays the profile its session chose, whatever the tab says it is', async () => {
    const world = createWorld();
    const session = world.handler.open(
      { accountId: 'me', profileId: '11111111-1111-4111-8111-111111111111' },
      world.socket,
    );

    await session.receive(JSON.stringify({ kind: 'subscribe', topics: ['profile'] }));
    await session.receive(
      JSON.stringify({ kind: 'identify', profileId: '22222222-2222-4222-8222-222222222222' }),
    );

    world.registry.publish(
      'profile',
      { name: 'Sam' },
      { kind: 'profiles', profileIds: ['22222222-2222-4222-8222-222222222222'] },
    );
    world.registry.publish(
      'profile',
      { name: 'Dan' },
      { kind: 'profiles', profileIds: ['11111111-1111-4111-8111-111111111111'] },
    );
    world.tick();
    await world.registry.drain();

    expect(world.read().filter((message) => message.kind === 'event')).toEqual([
      expect.objectContaining({ payload: { name: 'Dan' } }),
    ]);
  });

  it('does not act as a face belonging to somebody else', async () => {
    const world = createWorld();
    const session = world.handler.open({ accountId: 'me', profileId: null }, world.socket);

    await session.receive(JSON.stringify({ kind: 'subscribe', topics: ['profile'] }));
    await session.receive(
      JSON.stringify({
        kind: 'identify',
        profileId: '22222222-2222-4222-8222-222222222222',
        clientId: 'tab-one',
      }),
    );

    world.registry.publish(
      'profile',
      { name: 'Sam' },
      { kind: 'profiles', profileIds: ['22222222-2222-4222-8222-222222222222'] },
    );
    world.tick();
    await world.registry.drain();

    expect(world.read().filter((message) => message.kind === 'event')).toHaveLength(0);
    expect(world.presenceCalls.connected).toStrictEqual(['tab-one']);
  });

  it('deregisters the connection when the socket closes', () => {
    const world = createWorld();
    const session = world.handler.open({ accountId: 'me', profileId: null }, world.socket);

    session.close();

    expect(world.registry.count()).toBe(0);
  });

  it('keeps two tabs apart rather than giving them one connection', () => {
    const world = createWorld();

    const first = world.handler.open({ accountId: 'me', profileId: null }, world.socket);
    const second = world.handler.open({ accountId: 'me', profileId: null }, world.socket);

    expect(first.id).not.toBe(second.id);
    expect(world.registry.count()).toBe(2);
  });

  it('sends a ping so a dead socket can be noticed', () => {
    const world = createWorld();
    const session = world.handler.open({ accountId: 'me', profileId: null }, world.socket);

    session.ping();

    expect(world.read().some((message) => message.kind === 'ping')).toBe(true);
  });

  it('says a connection that has gone quiet is gone, so its socket can be closed', async () => {
    let clock = 1000;
    const registry = createRealtimeRegistry({
      entitlements: createEntitlements({
        resolve: () => Promise.resolve(new Set<Permission>()),
        now: () => 0,
        ttlMs: 0,
      }),
      now: () => clock,
      schedule: (run) => {
        run();

        return () => {};
      },
      windowMs: 50,
    });
    const handler = createRealtimeHandler({ registry, now: () => clock, newId: () => 'quiet' });
    const session = handler.open({ accountId: 'me', profileId: null }, { send: () => undefined });

    clock += 20_000;

    expect(session.ping()).toBe(true);

    await session.receive(JSON.stringify({ kind: 'pong' }));
    clock += 40_000;

    expect(session.ping()).toBe(true);

    clock += 60_000;

    expect(session.ping()).toBe(false);
  });

  it('registers the tab as present once it says which client it is', async () => {
    const world = createWorld();
    const session = world.handler.open({ accountId: 'me', profileId: null }, world.socket);

    await session.receive(
      JSON.stringify({ kind: 'identify', profileId: null, clientId: 'tab-one' }),
    );

    expect(world.presenceCalls.connected).toStrictEqual(['tab-one']);
  });

  it('does not register a tab that never said which client it is', async () => {
    const world = createWorld();
    const session = world.handler.open({ accountId: 'me', profileId: null }, world.socket);

    await session.receive(JSON.stringify({ kind: 'identify', profileId: null }));

    expect(world.presenceCalls.connected).toStrictEqual([]);
  });

  it('registers a tab again on a profile switch, so the name it is listed under keeps up', async () => {
    const world = createWorld();
    const session = world.handler.open({ accountId: 'me', profileId: null }, world.socket);

    await session.receive(
      JSON.stringify({ kind: 'identify', profileId: null, clientId: 'tab-one' }),
    );
    await session.receive(
      JSON.stringify({
        kind: 'identify',
        profileId: '11111111-1111-4111-8111-111111111111',
        clientId: 'tab-one',
      }),
    );

    expect(world.presenceCalls.connected).toStrictEqual(['tab-one', 'tab-one']);
  });

  it('takes the device label the tab gave', async () => {
    const world = createWorld();
    const session = world.handler.open({ accountId: 'me', profileId: null }, world.socket);

    await session.receive(
      JSON.stringify({
        kind: 'identify',
        profileId: null,
        clientId: 'tab-one',
        deviceLabel: 'Living room',
      }),
    );

    expect(world.presenceCalls.labels).toStrictEqual(['Living room']);
  });

  it('takes the kind of device the tab said it is', async () => {
    const world = createWorld();
    const session = world.handler.open({ accountId: 'me', profileId: null }, world.socket);

    await session.receive(
      JSON.stringify({
        kind: 'identify',
        profileId: null,
        clientId: 'tv-one',
        deviceLabel: 'Living room',
        clientKind: 'tv',
      }),
    );

    expect(world.presenceCalls.kinds).toStrictEqual(['tv']);
  });

  it('says nothing about the kind of device where the tab did not say', async () => {
    const world = createWorld();
    const session = world.handler.open({ accountId: 'me', profileId: null }, world.socket);

    await session.receive(
      JSON.stringify({ kind: 'identify', profileId: null, clientId: 'tab-one' }),
    );

    expect(world.presenceCalls.kinds).toStrictEqual([null]);
  });

  it('carries where the connection came from down to presence, which the tab cannot claim', async () => {
    const world = createWorld();
    const session = world.handler.open(
      { accountId: 'me', profileId: null, address: '203.0.113.7' },
      world.socket,
    );

    await session.receive(
      JSON.stringify({ kind: 'identify', profileId: null, clientId: 'tab-one' }),
    );

    expect(world.presenceCalls.addresses).toStrictEqual(['203.0.113.7']);
  });

  it('says a connection came from nowhere known where the server could not work it out', async () => {
    const world = createWorld();
    const session = world.handler.open({ accountId: 'me', profileId: null }, world.socket);

    await session.receive(
      JSON.stringify({ kind: 'identify', profileId: null, clientId: 'tab-one' }),
    );

    expect(world.presenceCalls.addresses).toStrictEqual([null]);
  });

  it('marks the tab as gone when the socket closes, without a separate stream to watch', async () => {
    const world = createWorld();
    const session = world.handler.open({ accountId: 'me', profileId: null }, world.socket);

    await session.receive(
      JSON.stringify({ kind: 'identify', profileId: null, clientId: 'tab-one' }),
    );
    session.close();

    expect(world.presenceCalls.disconnected).toStrictEqual(['tab-one']);
  });

  it('carries a stop from an administrator down to that tab', async () => {
    const world = createWorld();
    const session = world.handler.open({ accountId: 'me', profileId: null }, world.socket);

    await session.receive(
      JSON.stringify({ kind: 'identify', profileId: null, clientId: 'tab-one' }),
    );
    world.announce({ kind: 'stopped', reason: 'This stream was stopped by an admin.' });

    const event = world.read().find((message) => message.kind === 'event');

    expect(event?.kind === 'event' ? event.payload : null).toStrictEqual({
      kind: 'stopped',
      reason: 'This stream was stopped by an admin.',
    });
  });

  it('carries a note somebody sent to that tab, with what it said', async () => {
    const world = createWorld();
    const session = world.handler.open({ accountId: 'me', profileId: null }, world.socket);

    await session.receive(
      JSON.stringify({ kind: 'identify', profileId: null, clientId: 'tab-one' }),
    );
    world.announce({ kind: 'message', text: 'Tea is ready' });

    const event = world.read().find((message) => message.kind === 'event');

    expect(event?.kind === 'event' ? event.payload : null).toStrictEqual({
      kind: 'message',
      text: 'Tea is ready',
    });
  });

  it('carries a command from another of the same person’s devices, saying which', async () => {
    const world = createWorld();
    const session = world.handler.open({ accountId: 'me', profileId: null }, world.socket);

    await session.receive(
      JSON.stringify({ kind: 'identify', profileId: null, clientId: 'tab-one' }),
    );
    world.announce({
      kind: 'music',
      command: { kind: 'seek', positionSeconds: 42 },
      fromClientId: 'phone',
      fromLabel: 'iPhone',
    });

    const event = world.read().find((message) => message.kind === 'event');

    expect(event?.kind === 'event' ? event.payload : null).toStrictEqual({
      kind: 'music',
      command: { kind: 'seek', positionSeconds: 42 },
      fromClientId: 'phone',
      fromLabel: 'iPhone',
    });
  });

  it('carries a film command from another of the same person’s devices, saying which', async () => {
    const world = createWorld();
    const session = world.handler.open({ accountId: 'me', profileId: null }, world.socket);

    await session.receive(
      JSON.stringify({ kind: 'identify', profileId: null, clientId: 'tv-one' }),
    );
    world.announce({
      kind: 'video',
      command: {
        kind: 'play',
        mediaId: '00000000-0000-4000-8000-000000000001',
        startSeconds: 30,
        subtitleLanguage: 'fr',
        audioLanguage: null,
      },
      fromClientId: 'phone',
      fromLabel: 'iPhone',
    });

    const event = world.read().find((message) => message.kind === 'event');

    expect(event?.kind === 'event' ? event.payload : null).toStrictEqual({
      kind: 'video',
      command: {
        kind: 'play',
        mediaId: '00000000-0000-4000-8000-000000000001',
        startSeconds: 30,
        subtitleLanguage: 'fr',
        audioLanguage: null,
      },
      fromClientId: 'phone',
      fromLabel: 'iPhone',
    });
  });

  it('carries a resume, which has no reason to give', async () => {
    const world = createWorld();
    const session = world.handler.open({ accountId: 'me', profileId: null }, world.socket);

    await session.receive(
      JSON.stringify({ kind: 'identify', profileId: null, clientId: 'tab-one' }),
    );
    world.announce({ kind: 'resumed' });

    const event = world.read().find((message) => message.kind === 'event');

    expect(event?.kind === 'event' ? event.payload : null).toStrictEqual({ kind: 'resumed' });
  });

  it('lets an entitled connection take the admin feed', async () => {
    const world = createWorld(['server.logs']);
    const session = world.handler.open({ accountId: 'admin', profileId: null }, world.socket);

    await session.receive(JSON.stringify({ kind: 'subscribe', topics: ['logs'] }));

    expect(world.registry.topicsOf(session.id)).toStrictEqual(['logs']);
  });
});

describe('createRealtimeHandler, what a device says it is', () => {
  const AN_IPHONE = {
    id: 'phone-device-1',
    app: 'phone',
    system: 'ios',
    model: 'iPhone 17 Pro Max',
  } as const;

  const identifying = () =>
    JSON.stringify({
      kind: 'identify',
      profileId: null,
      clientId: 'phone-one',
      deviceLabel: 'iPhone',
      clientKind: 'phone',
      device: AN_IPHONE,
    });

  it('names the device from what it said about itself, and what it reached Valence through', async () => {
    const world = createWorld();
    const session = world.handler.open({ accountId: 'me', profileId: null }, world.socket);

    await session.receive(identifying());

    expect(world.presenceCalls.labels).toStrictEqual(['iPhone 17 Pro Max']);
    expect(world.presenceCalls.clientLabels).toStrictEqual(['Valence for iOS']);
  });

  it('notes the device against the sign-in the connection was opened with', async () => {
    const world = createWorld();
    const session = world.handler.open(
      { accountId: 'me', profileId: null, sessionId: 'sign-in-1' },
      world.socket,
    );

    await session.receive(identifying());

    expect(world.presenceCalls.noted).toHaveLength(1);
    expect(world.presenceCalls.noted).toMatchObject([
      {
        sessionId: 'sign-in-1',
        seen: {
          deviceId: 'phone-device-1',
          identity: { app: 'phone', system: 'ios', model: 'iPhone 17 Pro Max' },
          at: new Date(1000),
        },
      },
    ]);
  });

  it('notes nothing for a connection opened without a sign-in', async () => {
    const world = createWorld();
    const session = world.handler.open({ accountId: 'me', profileId: null }, world.socket);

    await session.receive(identifying());

    expect(world.presenceCalls.noted).toStrictEqual([]);
  });

  it('calls a device what its owner renamed it to', async () => {
    const world = createWorld([], new Map([['me/phone-device-1', 'Kitchen phone']]));
    const session = world.handler.open({ accountId: 'me', profileId: null }, world.socket);

    await session.receive(identifying());

    expect(world.presenceCalls.labels).toStrictEqual(['Kitchen phone']);
    expect(world.presenceCalls.renamed).toStrictEqual(['Kitchen phone']);
  });

  it('looks for a new name only on the account it was given on', async () => {
    const world = createWorld([], new Map([['somebody-else/phone-device-1', 'Their phone']]));
    const session = world.handler.open({ accountId: 'me', profileId: null }, world.socket);

    await session.receive(identifying());

    expect(world.presenceCalls.labels).toStrictEqual(['iPhone 17 Pro Max']);
    expect(world.presenceCalls.renamed).toStrictEqual([null]);
  });

  it('reads a browser from the user agent and brands the connection was opened with', async () => {
    const world = createWorld();
    const session = world.handler.open(
      {
        accountId: 'me',
        profileId: null,
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        brands: ['Microsoft Edge', 'Chromium'],
      },
      world.socket,
    );

    await session.receive(
      JSON.stringify({
        kind: 'identify',
        profileId: null,
        clientId: 'tab-one',
        deviceLabel: 'Edge on Windows',
        clientKind: 'browser',
        device: { id: 'browser-device-1' },
      }),
    );

    expect(world.presenceCalls.labels).toStrictEqual(['Windows PC']);
    expect(world.presenceCalls.clientLabels).toStrictEqual(['Edge on Windows']);
  });

  it('reads a tab from an older build by its user agent, not by the label it gave itself', async () => {
    const world = createWorld();
    const session = world.handler.open(
      {
        accountId: 'me',
        profileId: null,
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        brands: ['Google Chrome', 'Chromium'],
      },
      world.socket,
    );

    await session.receive(
      JSON.stringify({
        kind: 'identify',
        profileId: null,
        clientId: 'tab-one',
        deviceLabel: 'Chrome on macOS',
      }),
    );

    expect(world.presenceCalls.labels).toStrictEqual(['Mac']);
    expect(world.presenceCalls.clientLabels).toStrictEqual(['Chrome on macOS']);
  });

  it('names an older television app by the name it gives itself, on the television it is', async () => {
    const world = createWorld();
    const session = world.handler.open(
      { accountId: 'me', profileId: null, sessionId: 'sign-in-1', userAgent: 'okhttp/4.12.0' },
      world.socket,
    );

    await session.receive(
      JSON.stringify({
        kind: 'identify',
        profileId: null,
        clientId: 'tv-one',
        deviceLabel: 'Living Room',
        clientKind: 'tv',
      }),
    );

    expect(world.presenceCalls.labels).toStrictEqual(['Living Room']);
    expect(world.presenceCalls.clientLabels).toStrictEqual(['Valence for Android TV']);
  });

  it('leaves what an older app’s sign-in said about it alone, and only notes it was here', async () => {
    const world = createWorld();
    const session = world.handler.open(
      { accountId: 'me', profileId: null, sessionId: 'sign-in-1', userAgent: 'okhttp/4.12.0' },
      world.socket,
    );

    await session.receive(
      JSON.stringify({
        kind: 'identify',
        profileId: null,
        clientId: 'tv-one',
        deviceLabel: 'Living Room',
        clientKind: 'tv',
      }),
    );

    expect(world.presenceCalls.noted).toStrictEqual([]);
    expect(world.presenceCalls.active.map((one) => one.sessionId)).toStrictEqual(['sign-in-1']);
  });

  it('applies a name given to a sign-in whose client never said which device it is', async () => {
    const world = createWorld([], new Map([['me/sign-in-1', 'Den TV']]));
    const session = world.handler.open(
      { accountId: 'me', profileId: null, sessionId: 'sign-in-1' },
      world.socket,
    );

    await session.receive(
      JSON.stringify({
        kind: 'identify',
        profileId: null,
        clientId: 'tv-one',
        clientKind: 'tv',
        device: { app: 'tv', system: 'tvos' },
      }),
    );

    expect(world.presenceCalls.labels).toStrictEqual(['Den TV']);
  });

  it('registers nothing for a connection that closed while it was still saying who it is', async () => {
    const world = createWorld();
    const session = world.handler.open({ accountId: 'me', profileId: null }, world.socket);
    const identifying = session.receive(
      JSON.stringify({ kind: 'identify', profileId: null, clientId: 'tab-one' }),
    );

    session.close();
    await identifying;

    expect(world.presenceCalls.connected).toStrictEqual([]);
  });

  it('notes when the sign-in was last in use once its connection closes', async () => {
    const world = createWorld();
    const session = world.handler.open(
      { accountId: 'me', profileId: null, sessionId: 'sign-in-1' },
      world.socket,
    );

    await session.receive(identifying());
    session.close();

    expect(world.presenceCalls.active).toStrictEqual([
      { sessionId: 'sign-in-1', at: new Date(1000) },
    ]);
  });

  it('notes nothing on close for a connection that never said which client it is', () => {
    const world = createWorld();
    const session = world.handler.open(
      { accountId: 'me', profileId: null, sessionId: 'sign-in-1' },
      world.socket,
    );

    session.close();

    expect(world.presenceCalls.active).toStrictEqual([]);
  });
});

describe('a connection that is part of a watch party', () => {
  const withAParty = () => {
    const registry = createRealtimeRegistry({
      entitlements: createEntitlements({
        resolve: () => Promise.resolve(new Set<Permission>()),
        now: () => 0,
        ttlMs: 0,
      }),
      now: () => 1000,
      schedule: (run) => {
        run();

        return () => {};
      },
      windowMs: 50,
    });

    const parties = createPartyRegistry(() => 'party-1');
    const told: string[][] = [];

    const handler = createRealtimeHandler({
      registry,
      now: () => 1000,
      presence: {
        connect: () => true,
        disconnect: () => {},
        nameOf: () => Promise.resolve('Sam'),
      },
      newId: () => 'connection-1',
      party: {
        registry: parties,
        tell: (connectionIds) => told.push([...connectionIds]),
      },
    });

    const sent: string[] = [];

    return {
      parties,
      told,
      session: handler.open(
        { accountId: 'me', profileId: null },
        { send: (raw) => sent.push(raw) },
      ),
      read: (): FromServer[] =>
        sent.map((raw) => FromServerSchema.parse(JsonValueSchema.parse(JSON.parse(raw)))),
    };
  };

  it('answers a clock question with the time here, so a party can agree on one', async () => {
    const world = withAParty();

    await world.session.receive(JSON.stringify({ kind: 'clockAsk', sentAtMs: 40 }));

    expect(world.read().map((one) => one.kind)).toContain('clockTell');
  });

  it('carries the moment the asker sent, so they can measure the round trip', async () => {
    const world = withAParty();

    await world.session.receive(JSON.stringify({ kind: 'clockAsk', sentAtMs: 40 }));

    const told = world.read().find((one) => one.kind === 'clockTell');

    expect(told).toMatchObject({ sentAtMs: 40, serverAtMs: 1000 });
  });

  it('opens a party when asked to, under the name the presence service gives', async () => {
    const world = withAParty();

    await world.session.receive(JSON.stringify({ kind: 'partyOpen', mediaId: 'a-film' }));

    expect(world.parties.count()).toBe(1);
  });

  it('takes somebody out of their party when the connection closes', async () => {
    const world = withAParty();

    await world.session.receive(JSON.stringify({ kind: 'partyOpen', mediaId: 'a-film' }));

    expect(world.parties.count()).toBe(1);

    world.session.close();

    expect(world.parties.count()).toBe(0);
  });

  it('ignores a message of a kind it does not know', async () => {
    const world = withAParty();

    await world.session.receive(JSON.stringify({ kind: 'somethingElse' }));

    expect(world.read().filter((one) => one.kind !== 'welcome')).toEqual([]);
  });
});

describe('naming somebody in a party', () => {
  it('asks who they are once rather than on every message they send', async () => {
    const asked: string[] = [];
    const registry = createRealtimeRegistry({
      entitlements: createEntitlements({
        resolve: () => Promise.resolve(new Set<Permission>()),
        now: () => 0,
        ttlMs: 0,
      }),
      now: () => 1000,
      schedule: (run) => {
        run();

        return () => {};
      },
      windowMs: 50,
    });

    const parties = createPartyRegistry(() => 'party-1');

    const handler = createRealtimeHandler({
      registry,
      now: () => 1000,
      presence: {
        connect: () => true,
        disconnect: () => {},
        nameOf: (accountId) => {
          asked.push(accountId);

          return Promise.resolve('Sam');
        },
      },
      newId: () => 'connection-1',
      party: { registry: parties, tell: () => {} },
    });

    const session = handler.open({ accountId: 'me', profileId: null }, { send: () => {} });

    await session.receive(JSON.stringify({ kind: 'partyOpen', mediaId: 'a-film' }));
    await session.receive(JSON.stringify({ kind: 'partyLoosen', everyoneMaySeek: true }));

    expect(asked).toEqual(['me']);
  });
});
