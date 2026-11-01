import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEVICE_HEADER } from '@ValenceContracts/constants/DEVICE_HEADER';
import { readDeviceHints } from '@ValenceContracts/functions/readDeviceHints';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { carryTheDevice } from './carryTheDevice';

const asked = vi.fn<typeof fetch>();

/**
 * A page served from one origin, whose `fetch` the test can watch.
 */
const aPage = (): { fetch: typeof fetch; location: { origin: string } } => ({
  fetch: asked,
  location: { origin: 'https://valence.example' },
});

/**
 * The device header a request was sent with, read from whichever form the request took.
 */
const headerSent = (at = 0): string | null => {
  const [input, init] = asked.mock.calls[at] ?? [];

  if (input instanceof Request) {
    return input.headers.get(DEVICE_HEADER);
  }

  return new Headers(init?.headers).get(DEVICE_HEADER);
};

beforeEach(() => {
  asked.mockReset();
  asked.mockResolvedValue(new Response(null));

  const platform = aFakePlatform({
    describeThisDevice: () => ({ app: 'phone', system: 'ios', name: 'Dan’s iPhone' }),
  });

  platform.store.write('valence.deviceId', 'kept-device-id');
  installPlatform(platform);
});

afterEach(() => {
  forgetPlatform();
});

describe('carryTheDevice', () => {
  it('says which device a request for one of its own paths comes from', async () => {
    const page = aPage();

    carryTheDevice(page);
    await page.fetch('/api/session');

    expect(readDeviceHints(headerSent())).toEqual({
      app: 'phone',
      system: 'ios',
      name: 'Dan’s iPhone',
      id: 'kept-device-id',
    });
  });

  it('says so for a full address on its own origin', async () => {
    const page = aPage();

    carryTheDevice(page);
    await page.fetch('https://valence.example/api/session');

    expect(readDeviceHints(headerSent()).id).toBe('kept-device-id');
  });

  it('keeps the headers the request already had', async () => {
    const page = aPage();

    carryTheDevice(page);
    await page.fetch('/api/session', { method: 'POST', headers: { 'x-other': 'kept' } });

    const [, init] = asked.mock.calls[0] ?? [];

    expect(init?.method).toBe('POST');
    expect(new Headers(init?.headers).get('x-other')).toBe('kept');
    expect(headerSent()).not.toBeNull();
  });

  it('says so on a request made as a Request', async () => {
    const page = aPage();

    carryTheDevice(page);
    await page.fetch(new Request('https://valence.example/api/session'));

    expect(readDeviceHints(headerSent()).id).toBe('kept-device-id');
  });

  it('says nothing about this device to anywhere else', async () => {
    const page = aPage();

    carryTheDevice(page);
    await page.fetch('https://elsewhere.example/api/session', { headers: { 'x-other': 'kept' } });
    await page.fetch(new Request('https://elsewhere.example/api/session'));

    expect(headerSent(0)).toBeNull();
    expect(headerSent(1)).toBeNull();
    expect(asked.mock.calls[0]?.[1]).toEqual({ headers: { 'x-other': 'kept' } });
  });

  it('does not mistake an origin that only begins the same for its own', async () => {
    const page = aPage();

    carryTheDevice(page);
    await page.fetch('https://valence.example.elsewhere.example/api/session');

    expect(headerSent()).toBeNull();
  });

  it('marks only its own paths on a page that has no location', async () => {
    const page = { fetch: asked };

    carryTheDevice(page);
    await page.fetch('/api/session');
    await page.fetch('https://valence.example/api/session');

    expect(headerSent(0)).not.toBeNull();
    expect(headerSent(1)).toBeNull();
  });

  it('answers with whatever the page’s own fetch answered', async () => {
    const page = aPage();
    const answer = new Response('answered');

    asked.mockResolvedValue(answer);
    carryTheDevice(page);

    await expect(page.fetch('/api/session')).resolves.toBe(answer);
  });
});
