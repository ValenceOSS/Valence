import { describe, expect, it, vi } from 'vitest';
import { createBookDevices } from './createBookDevices';
import type { NowListening, NowReading } from '@ValenceContracts/schemas/BookRemote';
import type { PresenceEntry } from '@ValenceServer/presence/PresenceService';

const entry = (clientId: string): PresenceEntry => ({
  clientId,
  accountId: 'acc',
  profileId: 'me',
  profileName: 'Marques',
  guestOf: null,
  viaShare: null,
  address: null,
  deviceLabel: clientId,
  clientKind: null,
  connectedAt: 0,
  playback: null,
});

const LISTENING: NowListening = {
  bookId: '00000000-0000-4000-8000-000000000001',
  chapterId: '00000000-0000-4000-8000-000000000002',
  positionSeconds: 600,
  durationSeconds: 3600,
  isPlaying: true,
  reportedAtMs: 1,
};

const READING: NowReading = {
  bookId: '00000000-0000-4000-8000-000000000001',
  fraction: 0.5,
  pageNumber: null,
  reportedAtMs: 1,
};

const ME = { accountId: 'acc', profileId: 'me' };

const presenceWith = (entries: PresenceEntry[]) => ({
  list: () => entries,
  tell: vi.fn(() => true),
  watch: () => () => {},
});

describe('createBookDevices', () => {
  it('keeps what each device is listening to and reading, apart', () => {
    const devices = createBookDevices({
      presence: presenceWith([entry('phone'), entry('tablet')]),
    });

    expect(devices.reportListening(ME, 'phone', LISTENING)).toBe(true);
    expect(devices.reportReading(ME, 'tablet', READING)).toBe(true);
    expect(devices.listeningOn('phone')).toEqual(LISTENING);
    expect(devices.readingOn('phone')).toBeNull();
    expect(devices.readingOn('tablet')).toEqual(READING);
  });

  it('tells of each audiobook a device starts playing', () => {
    const onStarted = vi.fn();
    const devices = createBookDevices({
      presence: presenceWith([entry('phone')]),
      plays: { now: () => 0, onStarted, onStopped: vi.fn() },
    });

    devices.reportListening(ME, 'phone', LISTENING);

    expect(onStarted).toHaveBeenCalledWith({
      device: entry('phone'),
      report: LISTENING,
      startedAtMs: 0,
    });
  });

  it('sends a command only to a device that is listening to a book', () => {
    const presence = presenceWith([entry('phone'), entry('tablet')]);
    const devices = createBookDevices({ presence });

    devices.reportListening(ME, 'phone', LISTENING);
    devices.reportReading(ME, 'tablet', READING);

    expect(devices.order('phone', 'pause')).toBe(true);
    expect(devices.order('tablet', 'pause')).toBe(false);
    expect(presence.tell).toHaveBeenCalledWith('phone', { kind: 'book', command: 'pause' });
    expect(presence.tell).toHaveBeenCalledTimes(1);
  });
});
