import { describe, expect, it, vi } from 'vitest';
import { createDeviceRegistry } from '@ValenceServer/devices/createDeviceRegistry';
import type { PresenceEntry } from '@ValenceServer/presence/PresenceService';

const entry = (
  clientId: string,
  profileId: string | null,
  accountId: string | null = 'acc',
): PresenceEntry => ({
  clientId,
  accountId,
  profileId,
  profileName: 'Marques',
  guestOf: null,
  viaShare: null,
  address: null,
  deviceLabel: `${clientId} label`,
  clientKind: null,
  connectedAt: 0,
  playback: null,
});

const presenceWith = (entries: PresenceEntry[], isTold = true) => {
  const listeners = new Set<() => void>();
  let connected = entries;

  return {
    presence: {
      list: () => connected,
      tell: vi.fn(() => isTold),
      watch: (listener: () => void) => {
        listeners.add(listener);

        return () => {
          listeners.delete(listener);
        };
      },
    },
    change: (next: PresenceEntry[]) => {
      connected = next;

      for (const listener of listeners) {
        listener();
      }
    },
  };
};

const ME = { accountId: 'acc', profileId: 'me' };

describe('createDeviceRegistry', () => {
  it('owns the profile’s devices and the account’s undecided ones, and nobody else’s', () => {
    const { presence } = presenceWith([
      entry('laptop', 'me'),
      entry('fresh-tab', null),
      entry('theirs', 'them'),
      entry('elsewhere', 'me', 'other'),
    ]);

    expect(
      createDeviceRegistry<string>({ presence })
        .owned(ME)
        .map((one) => one.clientId),
    ).toEqual(['laptop', 'fresh-tab']);
  });

  it('owns every device on the account for somebody who has not chosen a profile', () => {
    const { presence } = presenceWith([entry('laptop', 'me'), entry('phone', 'them')]);

    expect(
      createDeviceRegistry<string>({ presence }).owned({ accountId: 'acc', profileId: null }),
    ).toHaveLength(2);
  });

  it('keeps what a device says, and forgets it when the device says nothing', () => {
    const { presence } = presenceWith([entry('laptop', 'me')]);
    const registry = createDeviceRegistry<string>({ presence });

    expect(registry.report(ME, 'laptop', 'watching Arrival')).toBe(true);
    expect(registry.reportOf('laptop')).toBe('watching Arrival');

    registry.report(ME, 'laptop', null);

    expect(registry.reportOf('laptop')).toBeNull();
  });

  it('will not take a report for a device that is not the person’s', () => {
    const onChanged = vi.fn();
    const { presence } = presenceWith([entry('theirs', 'them')]);
    const registry = createDeviceRegistry<string>({ presence, onChanged });

    expect(registry.report(ME, 'theirs', 'watching Arrival')).toBe(false);
    expect(registry.reportOf('theirs')).toBeNull();
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('says the person’s devices changed when one reports', () => {
    const onChanged = vi.fn();
    const { presence } = presenceWith([entry('laptop', 'me')]);

    createDeviceRegistry<string>({ presence, onChanged }).report(ME, 'laptop', 'x');

    expect(onChanged).toHaveBeenCalledWith('acc');
  });

  it('says a person’s devices changed when one opens, and when one closes', () => {
    const onChanged = vi.fn();
    const { presence, change } = presenceWith([]);

    createDeviceRegistry<string>({ presence, onChanged });
    change([entry('laptop', 'me')]);

    expect(onChanged).toHaveBeenCalledWith('acc');

    onChanged.mockClear();
    change([]);

    expect(onChanged).toHaveBeenCalledWith('acc');
  });

  it('says nothing when presence changes without any device coming or going', () => {
    const onChanged = vi.fn();
    const { presence, change } = presenceWith([]);

    createDeviceRegistry<string>({ presence, onChanged });
    change([entry('laptop', 'me')]);
    onChanged.mockClear();
    change([entry('laptop', 'me')]);

    expect(onChanged).not.toHaveBeenCalled();
  });

  it('tells nobody about a device that belongs to no account', () => {
    const onChanged = vi.fn();
    const { presence, change } = presenceWith([]);

    createDeviceRegistry<string>({ presence, onChanged });
    change([entry('guest', null, null)]);
    change([]);

    expect(onChanged).not.toHaveBeenCalled();
  });

  it('forgets what a device said once it closes', () => {
    const { presence, change } = presenceWith([]);
    const registry = createDeviceRegistry<string>({ presence });

    change([entry('laptop', 'me')]);
    registry.report(ME, 'laptop', 'watching Arrival');
    change([]);
    change([entry('laptop', 'me')]);

    expect(registry.reportOf('laptop')).toBeNull();
  });

  it('passes an event to another of the person’s devices, named after the one it came from', () => {
    const { presence } = presenceWith([entry('laptop', 'me'), entry('tv', 'me')]);

    const sent = createDeviceRegistry<string>({ presence }).tell(
      ME,
      'laptop',
      'tv',
      (fromLabel) => ({
        kind: 'message',
        text: fromLabel,
      }),
    );

    expect(sent).toBe(true);
    expect(presence.tell).toHaveBeenCalledWith('tv', { kind: 'message', text: 'laptop label' });
  });

  it('names a sender it cannot see as another device', () => {
    const { presence } = presenceWith([entry('tv', 'me')]);

    createDeviceRegistry<string>({ presence }).tell(ME, 'somewhere', 'tv', (fromLabel) => ({
      kind: 'message',
      text: fromLabel,
    }));

    expect(presence.tell).toHaveBeenCalledWith('tv', { kind: 'message', text: 'Another device' });
  });

  it('will not pass an event to somebody else’s device', () => {
    const { presence } = presenceWith([entry('laptop', 'me'), entry('theirs', 'them')]);

    expect(
      createDeviceRegistry<string>({ presence }).tell(ME, 'laptop', 'theirs', () => ({
        kind: 'resumed',
      })),
    ).toBe(false);
    expect(presence.tell).not.toHaveBeenCalled();
  });

  it('says an event did not arrive where presence could not deliver it', () => {
    const { presence } = presenceWith([entry('tv', 'me')], false);

    expect(
      createDeviceRegistry<string>({ presence }).tell(ME, 'laptop', 'tv', () => ({
        kind: 'resumed',
      })),
    ).toBe(false);
  });
});
