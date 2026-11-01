import { describe, expect, it } from 'vitest';
import type { DeviceIdentity } from '@ValenceContracts/schemas/DeviceIdentity';
import { nameTheDevice } from './nameTheDevice';

const NOTHING: DeviceIdentity = {
  app: 'browser',
  system: null,
  form: null,
  browser: null,
  inApp: null,
  maker: null,
  model: null,
  name: null,
};

/**
 * Names a device in English, the way the tests compare it.
 *
 * @param identity - What the device is.
 * @param renamed - What its owner renamed it to.
 * @returns The name.
 */
const named = (identity: Partial<DeviceIdentity>, renamed: string | null = null): string =>
  nameTheDevice({ ...NOTHING, ...identity }, renamed).message;

describe('nameTheDevice', () => {
  it('calls a device what its owner renamed it to, above all', () => {
    expect(named({ name: 'Dan’s Pixel', model: 'Pixel 9' }, 'Work phone')).toBe('Work phone');
  });

  it('calls it by its own name, else its model', () => {
    expect(named({ name: 'Dan’s Pixel', model: 'Pixel 9' })).toBe('Dan’s Pixel');
    expect(named({ model: 'iPhone 17 Pro Max' })).toBe('iPhone 17 Pro Max');
  });

  it('calls it the kind of thing it is where it has neither', () => {
    expect(named({ system: 'ios' })).toBe('iPhone');
    expect(named({ system: 'ipados' })).toBe('iPad');
    expect(named({ system: 'macos' })).toBe('Mac');
    expect(named({ system: 'windows' })).toBe('Windows PC');
    expect(named({ system: 'chromeos' })).toBe('Chromebook');
    expect(named({ system: 'android', form: 'phone' })).toBe('Android phone');
    expect(named({ system: 'android', form: 'tablet' })).toBe('Android tablet');
    expect(named({ system: 'tvos' })).toBe('Apple TV');
    expect(named({ system: 'webos' })).toBe('LG TV');
  });

  it('calls a television by its maker where its browser said who made it', () => {
    expect(named({ form: 'tv', maker: 'Hisense' })).toBe('Hisense TV');
    expect(named({ form: 'tv' })).toBe('Smart TV');
  });

  it('calls a device nothing is known about an unknown device', () => {
    expect(named({})).toBe('Unknown device');
  });

  it('carries a translatable code for a kind of device, and none for a name', () => {
    expect(nameTheDevice({ ...NOTHING, system: 'ios' }).code).toBe('common.iPhone');
    expect(nameTheDevice({ ...NOTHING, model: 'Pixel 9' }).code).toBeNull();
  });
});
