import { describe, expect, it } from 'vitest';
import type { DeviceIdentity } from '@ValenceContracts/schemas/DeviceIdentity';
import { nameTheClient } from './nameTheClient';

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
 * Names a client in English, the way the tests compare it.
 *
 * @param identity - What the device is.
 * @returns The name.
 */
const named = (identity: Partial<DeviceIdentity>): string =>
  nameTheClient({ ...NOTHING, ...identity }).message;

describe('nameTheClient', () => {
  it('names Valence’s own apps by what they are made for', () => {
    expect(named({ app: 'phone', system: 'ios' })).toBe('Valence for iOS');
    expect(named({ app: 'phone', system: 'android' })).toBe('Valence for Android');
    expect(named({ app: 'desktop', system: 'macos' })).toBe('Valence for macOS');
    expect(named({ app: 'tv', system: 'tvos' })).toBe('Valence for Apple TV');
    expect(named({ app: 'tv', system: 'fireOs' })).toBe('Valence for Fire TV');
    expect(named({ app: 'tv', system: 'androidTv' })).toBe('Valence for Android TV');
  });

  it('names one of Valence’s apps too old to say which as the Valence app', () => {
    expect(named({ app: 'tv', form: 'tv' })).toBe('The Valence app');
  });

  it('names Valence opened from a home screen as the web app', () => {
    expect(named({ app: 'webApp', system: 'ios', browser: 'safari' })).toBe(
      'Valence web app on iOS',
    );
  });

  it('names a browser and the system it runs on', () => {
    expect(named({ browser: 'safari', system: 'ios' })).toBe('Safari on iOS');
    expect(named({ browser: 'duckDuckGo', system: 'ios' })).toBe('DuckDuckGo on iOS');
    expect(named({ browser: 'edge', system: 'xbox' })).toBe('Edge on Xbox');
    expect(named({ browser: 'firefox' })).toBe('Firefox');
  });

  it('names an app’s browser by its app where it says, and as an app’s browser where not', () => {
    expect(named({ inApp: 'instagram', system: 'ios' })).toBe('Instagram in-app browser on iOS');
    expect(named({ inApp: 'unnamed', system: 'android' })).toBe('In-app browser on Android');
    expect(named({ inApp: 'unnamed' })).toBe('In-app browser');
  });

  it('names a browser it does not know as unknown', () => {
    expect(named({ system: 'android' })).toBe('Unknown browser on Android');
    expect(named({})).toBe('Unknown browser');
  });

  it('names a television’s own browser as that', () => {
    expect(named({ system: 'webos', form: 'tv' })).toBe('TV browser');
    expect(named({ form: 'tv', maker: 'Hisense' })).toBe('TV browser');
  });
});
