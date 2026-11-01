import { describe, expect, it } from 'vitest';
import { identifyDevice } from '@ValenceCore/functions/identifyDevice';
import type { HeldSession } from '@ValenceServer/devices/DeviceNotes';
import { groupIntoDevices } from './groupIntoDevices';

const FIREFOX_ON_A_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:131.0) Gecko/20100101 Firefox/131.0';

const AN_IPHONE = identifyDevice({
  userAgent: 'Valence/1 CFNetwork/3826 Darwin/25.0.0',
  kind: 'phone',
  hints: { system: 'ios', model: 'iPhone 17 Pro Max' },
});

const NOW = new Date(Date.UTC(2026, 10, 1, 12));

const minutesAgo = (minutes: number): Date => new Date(NOW.getTime() - minutes * 60_000);

const held = (overrides: Partial<HeldSession> & { id: string }): HeldSession => ({
  deviceId: null,
  device: null,
  userAgent: FIREFOX_ON_A_MAC,
  ipAddress: '192.168.1.20',
  createdAt: minutesAgo(600),
  lastActiveAt: null,
  expiresAt: new Date(Date.UTC(2026, 11, 1)),
  ...overrides,
});

const grouped = (
  sessions: HeldSession[],
  {
    renamed = new Map<string, string>(),
    currentSessionId = null,
    liveSessionIds = new Set<string>(),
  }: {
    renamed?: ReadonlyMap<string, string>;
    currentSessionId?: string | null;
    liveSessionIds?: ReadonlySet<string>;
  } = {},
) => groupIntoDevices({ held: sessions, renamed, currentSessionId, liveSessionIds, now: NOW });

describe('groupIntoDevices', () => {
  it('lists nothing for an account signed in nowhere', () => {
    expect(grouped([])).toStrictEqual([]);
  });

  it('gathers the sign-ins one device made into one device', () => {
    const devices = grouped([
      held({ id: 'first', deviceId: 'phone-device', device: AN_IPHONE }),
      held({ id: 'second', deviceId: 'phone-device', device: AN_IPHONE }),
    ]);

    expect(devices).toHaveLength(1);
    expect(devices[0]?.key).toBe('phone-device');
    expect(devices[0]?.sessionIds).toStrictEqual(['first', 'second']);
  });

  it('keeps each sign-in its own device where its client never said which device it is', () => {
    const devices = grouped([held({ id: 'one' }), held({ id: 'two' })]);

    expect(devices.map((device) => device.key).toSorted()).toStrictEqual(['one', 'two']);
  });

  it('shows the newest of a device’s sign-ins', () => {
    const [device] = grouped([
      held({
        id: 'older',
        deviceId: 'mac-device',
        lastActiveAt: minutesAgo(90),
        ipAddress: '10.0.0.1',
      }),
      held({
        id: 'newer',
        deviceId: 'mac-device',
        lastActiveAt: minutesAgo(5),
        ipAddress: '10.0.0.2',
      }),
    ]);

    expect(device?.id).toBe('newer');
    expect(device?.address).toBe('10.0.0.2');
  });

  it('shows the sign-in this list is read from, even where another of the device’s is newer', () => {
    const [device] = grouped(
      [
        held({ id: 'mine', deviceId: 'mac-device', lastActiveAt: minutesAgo(90) }),
        held({ id: 'newer', deviceId: 'mac-device', lastActiveAt: minutesAgo(5) }),
      ],
      { currentSessionId: 'mine' },
    );

    expect(device?.id).toBe('mine');
    expect(device?.isCurrent).toBe(true);
  });

  it('puts the device it is read on first, then those in use now, then the rest by last use', () => {
    const devices = grouped(
      [
        held({ id: 'long-ago', lastActiveAt: minutesAgo(500) }),
        held({ id: 'a-while-ago', lastActiveAt: minutesAgo(50) }),
        held({ id: 'in-use', lastActiveAt: minutesAgo(400) }),
        held({ id: 'this-one', lastActiveAt: minutesAgo(300) }),
      ],
      { currentSessionId: 'this-one', liveSessionIds: new Set(['in-use']) },
    );

    expect(devices.map((device) => device.id)).toStrictEqual([
      'this-one',
      'in-use',
      'a-while-ago',
      'long-ago',
    ]);
  });

  it('says which device is this one and which are in use now', () => {
    const devices = grouped(
      [held({ id: 'this-one' }), held({ id: 'in-use' }), held({ id: 'idle' })],
      { currentSessionId: 'this-one', liveSessionIds: new Set(['in-use']) },
    );

    expect(
      devices.map(({ id, isCurrent, isActiveNow }) => ({ id, isCurrent, isActiveNow })),
    ).toStrictEqual([
      { id: 'this-one', isCurrent: true, isActiveNow: false },
      { id: 'in-use', isCurrent: false, isActiveNow: true },
      { id: 'idle', isCurrent: false, isActiveNow: false },
    ]);
  });

  it('counts a device as in use where any of its sign-ins is', () => {
    const [device] = grouped(
      [held({ id: 'old', deviceId: 'mac-device' }), held({ id: 'new', deviceId: 'mac-device' })],
      { liveSessionIds: new Set(['old']) },
    );

    expect(device?.isActiveNow).toBe(true);
  });

  it('says a device in use now was last used now', () => {
    const [device] = grouped([held({ id: 'in-use', lastActiveAt: minutesAgo(30) })], {
      liveSessionIds: new Set(['in-use']),
    });

    expect(device?.lastActiveAt).toBe(NOW.toISOString());
  });

  it('says a device not in use was last used when any of its sign-ins last was', () => {
    const [device] = grouped([
      held({ id: 'old', deviceId: 'mac-device', lastActiveAt: minutesAgo(30) }),
      held({ id: 'never-seen', deviceId: 'mac-device', createdAt: minutesAgo(200) }),
    ]);

    expect(device?.lastActiveAt).toBe(minutesAgo(30).toISOString());
  });

  it('says a device signed in when its newest sign-in began', () => {
    const [device] = grouped([
      held({ id: 'first', deviceId: 'mac-device', createdAt: minutesAgo(900) }),
      held({ id: 'again', deviceId: 'mac-device', createdAt: minutesAgo(100) }),
    ]);

    expect(device?.signedInAt).toBe(minutesAgo(100).toISOString());
  });

  it('runs a device out when the last of its sign-ins runs out', () => {
    const [device] = grouped([
      held({ id: 'first', deviceId: 'mac-device', expiresAt: new Date(Date.UTC(2026, 11, 1)) }),
      held({ id: 'again', deviceId: 'mac-device', expiresAt: new Date(Date.UTC(2026, 11, 20)) }),
    ]);

    expect(device?.expiresAt).toBe(new Date(Date.UTC(2026, 11, 20)).toISOString());
  });

  it('names a device by what it is and what it reaches Valence through', () => {
    const [device] = grouped([held({ id: 'phone', deviceId: 'phone-device', device: AN_IPHONE })]);

    expect(device?.device?.message).toBe('iPhone 17 Pro Max');
    expect(device?.client?.message).toBe('Valence for iOS');
    expect(device?.name.message).toBe('iPhone 17 Pro Max · Valence for iOS');
    expect(device?.identity).toStrictEqual(AN_IPHONE);
  });

  it('works out what a device is from its user agent where it never said', () => {
    const [device] = grouped([held({ id: 'mac', device: null })]);

    expect(device?.identity).toStrictEqual(identifyDevice({ userAgent: FIREFOX_ON_A_MAC }));
    expect(device?.name.message).toBe('Mac · Firefox on macOS');
  });

  it('carries the user agent its newest sign-in sent, for anybody who wants the raw string', () => {
    const [device] = grouped([
      held({
        id: 'older',
        deviceId: 'mac',
        userAgent: 'Firefox/130.0',
        createdAt: minutesAgo(900),
      }),
      held({ id: 'newer', deviceId: 'mac' }),
    ]);

    expect(device?.userAgent).toBe(FIREFOX_ON_A_MAC);
  });

  it('names a device what its owner renamed it to', () => {
    const [device] = grouped([held({ id: 'phone', deviceId: 'phone-device', device: AN_IPHONE })], {
      renamed: new Map([['phone-device', 'Kitchen phone']]),
    });

    expect(device?.renamed).toBe('Kitchen phone');
    expect(device?.device?.message).toBe('Kitchen phone');
    expect(device?.name.message).toBe('Kitchen phone · Valence for iOS');
  });

  it('renames a device that never said which it is by its sign-in', () => {
    const [device] = grouped([held({ id: 'mac' })], {
      renamed: new Map([['mac', 'Office Mac']]),
    });

    expect(device?.device?.message).toBe('Office Mac');
  });

  it('leaves alone a device somebody renamed a different one of', () => {
    const [device] = grouped([held({ id: 'phone', deviceId: 'phone-device', device: AN_IPHONE })], {
      renamed: new Map([['another-device', 'Kitchen phone']]),
    });

    expect(device?.renamed).toBeNull();
    expect(device?.device?.message).toBe('iPhone 17 Pro Max');
  });

  it('keeps the sign-in it is read from a row of its own, so another claiming its device shows', () => {
    const devices = grouped(
      [
        held({ id: 'mine', deviceId: 'my-mac', lastActiveAt: minutesAgo(1) }),
        held({ id: 'claiming', deviceId: 'my-mac', lastActiveAt: minutesAgo(2) }),
      ],
      { currentSessionId: 'mine' },
    );

    expect(devices.map((one) => [one.sessionIds, one.isCurrent])).toStrictEqual([
      [['mine'], true],
      [['claiming'], false],
    ]);
  });
});
