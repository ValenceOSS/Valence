import { describe, expect, it, vi } from 'vitest';
import { createMusicDevices } from './createMusicDevices';
import type { MusicNowPlaying } from '@ValenceContracts/schemas/MusicRemote';
import type { PresenceEntry } from '@ValenceServer/presence/PresenceService';

const entry = (
  clientId: string,
  profileId: string | null,
  deviceLabel = clientId,
): PresenceEntry => ({
  clientId,
  accountId: 'acc',
  profileId,
  profileName: 'Marques',
  deviceLabel,
  connectedAt: 0,
  playback: null,
});

const NOW_PLAYING: MusicNowPlaying = {
  trackId: '00000000-0000-4000-8000-000000000001',
  title: 'Caramel',
  artists: ['Sleep Token'],
  albumId: '00000000-0000-4000-8000-000000000002',
  hasArtwork: true,
  positionSeconds: 12,
  durationSeconds: 300,
  isPlaying: true,
  volume: 0.8,
  reportedAtMs: 1,
};

const presenceWith = (entries: PresenceEntry[]) => {
  const listeners = new Set<() => void>();
  let connected = entries;

  return {
    presence: {
      list: () => connected,
      tell: vi.fn(() => true),
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

describe('createMusicDevices', () => {
  it('lists every copy of Valence the profile has open, and nobody else’s', () => {
    const { presence } = presenceWith([
      entry('laptop', 'me', 'MacBook'),
      entry('phone', 'me', 'iPhone'),
      entry('theirs', 'them'),
    ]);

    expect(createMusicDevices({ presence }).list(ME)).toEqual([
      { clientId: 'laptop', label: 'MacBook', nowPlaying: null },
      { clientId: 'phone', label: 'iPhone', nowPlaying: null },
    ]);
  });

  it('shows what a device said it is playing', () => {
    const { presence } = presenceWith([entry('laptop', 'me')]);
    const devices = createMusicDevices({ presence });

    expect(devices.report(ME, 'laptop', NOW_PLAYING)).toBe(true);
    expect(devices.list(ME)[0]?.nowPlaying).toEqual(NOW_PLAYING);
  });

  it('does not take a report from a device that is not the profile’s', () => {
    const { presence } = presenceWith([entry('theirs', 'them')]);

    expect(createMusicDevices({ presence }).report(ME, 'theirs', NOW_PLAYING)).toBe(false);
  });

  it('counts a window that has not said which profile it is as the account’s', () => {
    const { presence } = presenceWith([entry('fresh-tab', null)]);

    expect(createMusicDevices({ presence }).list(ME)).toHaveLength(1);
  });

  it('never counts another account’s device, whatever profile it says', () => {
    const { presence } = presenceWith([{ ...entry('elsewhere', 'me'), accountId: 'other' }]);

    expect(createMusicDevices({ presence }).list(ME)).toEqual([]);
  });

  it('tells whoever is listening when a device starts or stops playing', () => {
    const onChanged = vi.fn();
    const { presence } = presenceWith([entry('laptop', 'me')]);

    createMusicDevices({ presence, onChanged }).report(ME, 'laptop', null);

    expect(onChanged).toHaveBeenCalledWith('acc');
  });

  it('forgets what a device was playing once it goes away, and says so', () => {
    const onChanged = vi.fn();
    const { presence, change } = presenceWith([entry('laptop', 'me')]);
    const devices = createMusicDevices({ presence, onChanged });

    change([entry('laptop', 'me')]);
    devices.report(ME, 'laptop', NOW_PLAYING);
    onChanged.mockClear();
    change([]);
    change([entry('laptop', 'me')]);

    expect(onChanged).toHaveBeenCalledWith('acc');
    expect(devices.list(ME)[0]?.nowPlaying).toBeNull();
  });

  it('passes a command to another of the profile’s devices, saying where it came from', () => {
    const { presence } = presenceWith([entry('laptop', 'me', 'MacBook'), entry('phone', 'me')]);

    const sent = createMusicDevices({ presence }).command(ME, 'laptop', 'phone', {
      kind: 'pause',
    });

    expect(sent).toBe(true);
    expect(presence.tell).toHaveBeenCalledWith('phone', {
      kind: 'music',
      command: { kind: 'pause' },
      fromClientId: 'laptop',
      fromLabel: 'MacBook',
    });
  });

  it('will not command somebody else’s device', () => {
    const { presence } = presenceWith([entry('laptop', 'me'), entry('theirs', 'them')]);

    expect(
      createMusicDevices({ presence }).command(ME, 'laptop', 'theirs', { kind: 'pause' }),
    ).toBe(false);
    expect(presence.tell).not.toHaveBeenCalled();
  });
});
