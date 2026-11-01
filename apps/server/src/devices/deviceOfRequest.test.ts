import { describe, expect, it } from 'vitest';
import { writeDeviceHints } from '@ValenceContracts/functions/writeDeviceHints';
import { identifyDevice } from '@ValenceCore/functions/identifyDevice';
import { deviceOfRequest } from './deviceOfRequest';

const CHROME_ON_WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

describe('deviceOfRequest', () => {
  it('describes a request that carried nothing as an unknown device', () => {
    expect(deviceOfRequest(null)).toStrictEqual({
      deviceId: null,
      identity: identifyDevice({ userAgent: null }),
    });
    expect(deviceOfRequest(undefined)).toStrictEqual(deviceOfRequest(null));
  });

  it('believes what the client said about its device, and which device it is', () => {
    const device = deviceOfRequest(
      new Headers({
        'x-valence-device': writeDeviceHints({
          id: 'phone-device-1',
          app: 'phone',
          system: 'ios',
          model: 'iPhone 17 Pro Max',
          name: 'Dan’s iPhone',
        }),
        'user-agent': 'Valence/1 CFNetwork/3826 Darwin/25.0.0',
      }),
    );

    expect(device.deviceId).toBe('phone-device-1');
    expect(device.identity).toMatchObject({
      app: 'phone',
      system: 'ios',
      form: 'phone',
      model: 'iPhone 17 Pro Max',
      name: 'Dan’s iPhone',
    });
  });

  it('takes the kind of client it said it is', () => {
    const device = deviceOfRequest(
      new Headers({ 'x-valence-client-kind': 'tv', 'user-agent': 'okhttp/4.12.0' }),
    );

    expect(device.identity.app).toBe('tv');
  });

  it('ignores a kind of client it does not know', () => {
    const device = deviceOfRequest(
      new Headers({ 'x-valence-client-kind': 'toaster', 'user-agent': CHROME_ON_WINDOWS }),
    );

    expect(device.identity.app).toBe('browser');
  });

  it('reads a browser from its user agent where its client said nothing', () => {
    const device = deviceOfRequest(new Headers({ 'user-agent': CHROME_ON_WINDOWS }));

    expect(device).toStrictEqual({
      deviceId: null,
      identity: identifyDevice({ userAgent: CHROME_ON_WINDOWS }),
    });
    expect(device.identity).toMatchObject({ system: 'windows', browser: 'chromium' });
  });

  it('tells a Chromium browser apart by the brands its client hints name', () => {
    const device = deviceOfRequest(
      new Headers({
        'user-agent': CHROME_ON_WINDOWS,
        'sec-ch-ua': '"Microsoft Edge";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      }),
    );

    expect(device.identity.browser).toBe('edge');
  });

  it('describes from the user agent alone a device whose header cannot be read', () => {
    const device = deviceOfRequest(
      new Headers({ 'x-valence-device': '%%not-json', 'user-agent': CHROME_ON_WINDOWS }),
    );

    expect(device).toStrictEqual({
      deviceId: null,
      identity: identifyDevice({ userAgent: CHROME_ON_WINDOWS }),
    });
  });
});
