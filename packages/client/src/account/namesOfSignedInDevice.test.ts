import { describe, expect, it } from 'vitest';
import { saying } from '@ValenceI18n/saying';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { SignedInDeviceSchema } from '@ValenceContracts/schemas/SignedInDevice';
import { namesOfSignedInDevice } from './namesOfSignedInDevice';

const A_DEVICE = {
  id: 'device-1',
  name: sayVerbatim('Chrome on macOS'),
  address: '10.0.0.2',
  signedInAt: '2026-08-10T00:00:00.000Z',
  expiresAt: '2026-09-10T00:00:00.000Z',
};

describe('namesOfSignedInDevice', () => {
  it('names the device and what it reaches Valence through apart', () => {
    const device = SignedInDeviceSchema.parse({
      ...A_DEVICE,
      device: sayVerbatim('iPhone 17 Pro Max'),
      client: saying('common.valenceForSystem', { system: 'iOS' }),
    });

    expect(namesOfSignedInDevice(device)).toEqual({
      device: 'iPhone 17 Pro Max',
      client: 'Valence for iOS',
    });
  });

  it('falls back to the one name an older server gave', () => {
    const device = SignedInDeviceSchema.parse(A_DEVICE);

    expect(namesOfSignedInDevice(device)).toEqual({ device: 'Chrome on macOS', client: null });
  });

  it('names the device even where its client is not known', () => {
    const device = SignedInDeviceSchema.parse({
      ...A_DEVICE,
      device: sayVerbatim('Living Room'),
    });

    expect(namesOfSignedInDevice(device)).toEqual({ device: 'Living Room', client: null });
  });
});
