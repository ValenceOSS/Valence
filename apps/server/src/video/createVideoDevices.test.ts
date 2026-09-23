import { describe, expect, it, vi } from 'vitest';
import { createVideoDevices } from '@ValenceServer/video/createVideoDevices';
import type { VideoNowWatching } from '@ValenceContracts/schemas/VideoRemote';
import type { ClientKind } from '@ValenceContracts/schemas/ClientKind';
import type { PresenceEntry } from '@ValenceServer/presence/PresenceService';

const entry = (
  clientId: string,
  profileId: string | null,
  clientKind: ClientKind | null = null,
): PresenceEntry => ({
  clientId,
  accountId: 'acc',
  profileId,
  profileName: 'Marques',
  guestOf: null,
  viaShare: null,
  address: null,
  deviceLabel: `${clientId} label`,
  clientKind,
  connectedAt: 0,
  playback: null,
});

const NOW_WATCHING: VideoNowWatching = {
  mediaId: '00000000-0000-4000-8000-000000000001',
  title: 'Arrival',
  subtitle: null,
  hasBackdrop: true,
  positionSeconds: 60,
  durationSeconds: 6000,
  isPlaying: true,
  reportedAtMs: 1,
};

const presenceWith = (entries: PresenceEntry[]) => ({
  list: () => entries,
  tell: vi.fn(() => true),
  watch: () => () => {},
});

const ME = { accountId: 'acc', profileId: 'me' };

describe('createVideoDevices', () => {
  it('lists the person’s devices, what kind each is and what each is watching', () => {
    const presence = presenceWith([
      entry('laptop', 'me', 'browser'),
      entry('tv', 'me', 'tv'),
      entry('theirs', 'them', 'tv'),
    ]);
    const devices = createVideoDevices({ presence });

    devices.report(ME, 'tv', NOW_WATCHING);

    expect(devices.list(ME)).toEqual([
      { clientId: 'laptop', label: 'laptop label', kind: 'browser', nowWatching: null },
      { clientId: 'tv', label: 'tv label', kind: 'tv', nowWatching: NOW_WATCHING },
    ]);
  });

  it('lists a device that never said what kind it is as of no kind', () => {
    const devices = createVideoDevices({ presence: presenceWith([entry('old-tab', 'me')]) });

    expect(devices.list(ME)[0]?.kind).toBeNull();
  });

  it('will not take a report from somebody else’s device', () => {
    const devices = createVideoDevices({ presence: presenceWith([entry('theirs', 'them')]) });

    expect(devices.report(ME, 'theirs', NOW_WATCHING)).toBe(false);
  });

  it('tells whoever is listening when a device starts or stops watching', () => {
    const onChanged = vi.fn();
    const devices = createVideoDevices({ presence: presenceWith([entry('tv', 'me')]), onChanged });

    devices.report(ME, 'tv', null);

    expect(onChanged).toHaveBeenCalledWith('acc');
  });

  it('passes a film command to another of the person’s devices, saying where it came from', () => {
    const presence = presenceWith([entry('laptop', 'me'), entry('tv', 'me', 'tv')]);

    const sent = createVideoDevices({ presence }).command(ME, 'laptop', 'tv', {
      kind: 'play',
      mediaId: NOW_WATCHING.mediaId,
      startSeconds: 30,
    });

    expect(sent).toBe(true);
    expect(presence.tell).toHaveBeenCalledWith('tv', {
      kind: 'video',
      command: { kind: 'play', mediaId: NOW_WATCHING.mediaId, startSeconds: 30 },
      fromClientId: 'laptop',
      fromLabel: 'laptop label',
    });
  });

  it('will not command somebody else’s device', () => {
    const presence = presenceWith([entry('laptop', 'me'), entry('theirs', 'them', 'tv')]);

    expect(createVideoDevices({ presence }).command(ME, 'laptop', 'theirs', { kind: 'stop' })).toBe(
      false,
    );
    expect(presence.tell).not.toHaveBeenCalled();
  });
});
