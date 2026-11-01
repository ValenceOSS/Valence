import { describe, expect, it } from 'vitest';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import type { HeldDevice } from '@ValenceServer/devices/groupIntoDevices';
import { shownDevice } from './shownDevice';

const A_DEVICE: HeldDevice = {
  key: 'phone-device',
  sessionIds: ['first', 'second'],
  id: 'second',
  name: sayVerbatim('Kitchen phone · Valence for iOS'),
  device: sayVerbatim('Kitchen phone'),
  client: sayVerbatim('Valence for iOS'),
  identity: null,
  renamed: 'Kitchen phone',
  address: '192.168.1.40',
  signedInAt: '2026-10-01T00:00:00.000Z',
  lastActiveAt: '2026-11-01T12:00:00.000Z',
  isActiveNow: true,
  expiresAt: '2026-12-01T00:00:00.000Z',
  isCurrent: false,
};

describe('shownDevice', () => {
  it('sends a device without the server’s own handles on the sign-ins behind it', () => {
    const shown = shownDevice(A_DEVICE);

    expect(shown).not.toHaveProperty('key');
    expect(shown).not.toHaveProperty('sessionIds');
  });

  it('sends everything else about the device as it is held', () => {
    const { key: _key, sessionIds: _sessionIds, ...rest } = A_DEVICE;

    expect(shownDevice(A_DEVICE)).toStrictEqual(rest);
  });
});
