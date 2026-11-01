import { afterEach, describe, expect, it } from 'vitest';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { theDeviceHints } from './theDeviceHints';

afterEach(() => {
  forgetPlatform();
});

describe('theDeviceHints', () => {
  it('says nothing before a host is installed', () => {
    forgetPlatform();

    expect(theDeviceHints()).toEqual({});
  });

  it('says what the host knows about the device, with which device this is', () => {
    const platform = aFakePlatform({
      describeThisDevice: () => ({ app: 'phone', system: 'ios', model: 'iPhone 17 Pro Max' }),
    });

    platform.store.write('valence.deviceId', 'kept-device-id');
    installPlatform(platform);

    expect(theDeviceHints()).toEqual({
      app: 'phone',
      system: 'ios',
      model: 'iPhone 17 Pro Max',
      id: 'kept-device-id',
    });
  });

  it('keeps its own id over one the host gave', () => {
    const platform = aFakePlatform({ describeThisDevice: () => ({ id: 'the-hosts-own-id' }) });

    platform.store.write('valence.deviceId', 'kept-device-id');
    installPlatform(platform);

    expect(theDeviceHints().id).toBe('kept-device-id');
  });

  it('trims a name to what the server will read', () => {
    installPlatform(aFakePlatform({ describeThisDevice: () => ({ name: '  Dan’s iPhone  ' }) }));

    expect(theDeviceHints().name).toBe('Dan’s iPhone');
  });

  it('drops a name the server would refuse rather than sending it', () => {
    installPlatform(aFakePlatform({ describeThisDevice: () => ({ name: 'x'.repeat(81) }) }));

    expect(theDeviceHints().name).toBeUndefined();
  });
});
