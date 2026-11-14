import { describe, expect, it } from 'vitest';
import { readJellyfinClient } from './readJellyfinClient';

describe('readJellyfinClient', () => {
  it('reads the app, its device and its token from the authorization header', () => {
    const headers = new Headers({
      authorization:
        'MediaBrowser Client="Findroid", Device="Pixel%208", DeviceId="abc", Version="0.15", Token="s.t"',
    });

    expect(readJellyfinClient(headers, {})).toEqual({
      client: 'Findroid',
      device: 'Pixel 8',
      deviceId: 'abc',
      version: '0.15',
      token: 's.t',
    });
  });

  it('reads the older header, and a token sent on its own', () => {
    expect(
      readJellyfinClient(
        new Headers({ 'x-emby-authorization': 'Emby Client="Infuse"', 'x-emby-token': 'k.key' }),
        {},
      ),
    ).toMatchObject({ client: 'Infuse', token: 'k.key' });
  });

  it('reads a token from the address, for a player that sends nothing else', () => {
    expect(readJellyfinClient(new Headers(), { api_key: 's.q' }).token).toBe('s.q');
  });

  it('ignores a bearer token, which is Valence’s own', () => {
    expect(readJellyfinClient(new Headers({ authorization: 'Bearer x' }), {}).token).toBeNull();
  });

  it('keeps a field that was not escaped properly as it was sent', () => {
    expect(
      readJellyfinClient(new Headers({ authorization: 'MediaBrowser Device="100%"' }), {}).device,
    ).toBe('100%');
  });
});
