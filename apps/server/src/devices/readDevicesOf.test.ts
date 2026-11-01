import { describe, expect, it, vi } from 'vitest';
import type { DeviceNotes, HeldSession } from '@ValenceServer/devices/DeviceNotes';
import { readDevicesOf } from './readDevicesOf';

const NOW = new Date(Date.UTC(2026, 10, 1, 12));

const held = (id: string, deviceId: string | null = null): HeldSession => ({
  id,
  deviceId,
  device: null,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:131.0) Gecko/20100101 Firefox/131.0',
  ipAddress: null,
  createdAt: new Date(Date.UTC(2026, 9, 1)),
  lastActiveAt: null,
  expiresAt: new Date(Date.UTC(2026, 11, 1)),
});

const notesHolding = (
  sessions: HeldSession[],
  renamed: ReadonlyMap<string, string> = new Map(),
): DeviceNotes => ({
  heldBy: vi.fn(() => Promise.resolve(sessions)),
  note: vi.fn(() => Promise.resolve()),
  noteActive: vi.fn(() => Promise.resolve()),
  renamedBy: vi.fn(() => Promise.resolve(renamed)),
  rename: vi.fn(() => Promise.resolve()),
  end: vi.fn(() => Promise.resolve()),
});

const nobodyPresent = { list: () => [] };

describe('readDevicesOf', () => {
  it('reads the account’s sign-ins and their names from the server’s notes', async () => {
    const notes = notesHolding(
      [held('first', 'mac-device'), held('second', 'mac-device')],
      new Map([['mac-device', 'Office Mac']]),
    );
    const heldWithoutNotes = vi.fn(() => Promise.resolve([held('elsewhere')]));

    const devices = await readDevicesOf({
      userId: 'ada',
      currentSessionId: null,
      notes,
      heldWithoutNotes,
      presence: nobodyPresent,
      now: NOW,
    });

    expect(notes.heldBy).toHaveBeenCalledWith('ada', NOW);
    expect(notes.renamedBy).toHaveBeenCalledWith('ada');
    expect(heldWithoutNotes).not.toHaveBeenCalled();
    expect(devices).toHaveLength(1);
    expect(devices[0]).toMatchObject({
      key: 'mac-device',
      isCurrent: false,
      renamed: 'Office Mac',
    });
  });

  it('reads the sign-ins alone where the server keeps no notes, and names none of them', async () => {
    const devices = await readDevicesOf({
      userId: 'ada',
      currentSessionId: 'only',
      notes: undefined,
      heldWithoutNotes: () => Promise.resolve([held('only')]),
      presence: nobodyPresent,
      now: NOW,
    });

    expect(devices).toHaveLength(1);
    expect(devices[0]).toMatchObject({ key: 'only', isCurrent: true, renamed: null });
    expect(devices[0]?.device?.message).toBe('Mac');
  });

  it('counts a device as in use where a connection present now holds one of its sign-ins', async () => {
    const devices = await readDevicesOf({
      userId: 'ada',
      currentSessionId: null,
      notes: notesHolding([held('in-use'), held('idle')]),
      heldWithoutNotes: () => Promise.resolve([]),
      presence: { list: () => [{ sessionId: null }, { sessionId: 'in-use' }] },
      now: NOW,
    });

    expect(
      devices.map(({ id, isActiveNow, lastActiveAt }) => ({ id, isActiveNow, lastActiveAt })),
    ).toStrictEqual([
      { id: 'in-use', isActiveNow: true, lastActiveAt: NOW.toISOString() },
      {
        id: 'idle',
        isActiveNow: false,
        lastActiveAt: new Date(Date.UTC(2026, 9, 1)).toISOString(),
      },
    ]);
  });
});
