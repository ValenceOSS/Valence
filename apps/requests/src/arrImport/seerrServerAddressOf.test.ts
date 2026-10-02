import { describe, expect, it } from 'vitest';
import { seerrServerAddressOf } from './seerrServerAddressOf';

const A_SERVER = {
  id: 0,
  name: 'Radarr',
  hostname: 'radarr',
  port: 7878,
  apiKey: 'key',
  useSsl: false,
  is4k: false,
  isDefault: true,
};

describe('seerrServerAddressOf', () => {
  it('builds the address Overseerr reaches a server at', () => {
    expect(seerrServerAddressOf(A_SERVER)).toBe('http://radarr:7878');
    expect(
      seerrServerAddressOf({
        ...A_SERVER,
        useSsl: true,
        hostname: 'https://arr.lan/',
        baseUrl: '/radarr/',
      }),
    ).toBe('https://arr.lan:7878/radarr');
  });
});
