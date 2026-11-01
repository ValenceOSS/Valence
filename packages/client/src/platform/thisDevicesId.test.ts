import { afterEach, describe, expect, it } from 'vitest';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { thisDevicesId } from './thisDevicesId';

afterEach(() => {
  forgetPlatform();
});

describe('thisDevicesId', () => {
  it('makes an id the first time and keeps it where the client keeps its preferences', () => {
    const platform = aFakePlatform();

    installPlatform(platform);

    const made = thisDevicesId();

    expect(made).not.toBe('');
    expect(platform.store.read('valence.deviceId')).toBe(made);
  });

  it('answers with the same id every time it is asked', () => {
    installPlatform(aFakePlatform());

    expect(thisDevicesId()).toBe(thisDevicesId());
  });

  it('reuses the id this device already had', () => {
    const platform = aFakePlatform();

    platform.store.write('valence.deviceId', 'kept-device-id');
    installPlatform(platform);

    expect(thisDevicesId()).toBe('kept-device-id');
  });

  it('makes a new id where the one kept is empty', () => {
    const platform = aFakePlatform();

    platform.store.write('valence.deviceId', '');
    installPlatform(platform);

    expect(thisDevicesId()).not.toBe('');
    expect(platform.store.read('valence.deviceId')).toBe(thisDevicesId());
  });
});
