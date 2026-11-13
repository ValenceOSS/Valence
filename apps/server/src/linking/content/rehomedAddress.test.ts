import { describe, expect, it } from 'vitest';
import { rehomedAddress } from './rehomedAddress';

const FROM = '/api/playback/session/s1/';

const TO = '/api/playback/session/linked~a~s1/';

describe('rehomedAddress', () => {
  it('puts a file under the linked server’s route under this server’s own', () => {
    expect(rehomedAddress(`${FROM}index.m3u8`, FROM, TO)).toBe(`${TO}index.m3u8`);
    expect(rehomedAddress(`${FROM}index.m3u8?start=12.5`, FROM, TO)).toBe(
      `${TO}index.m3u8?start=12.5`,
    );
  });

  it('refuses an address anywhere else', () => {
    for (const address of [
      'https://elsewhere.example/api/playback/session/s1/index.m3u8',
      '//elsewhere.example/api/playback/session/s1/index.m3u8',
      '/api/playback/session/s2/index.m3u8',
      `${FROM}../../../libraries`,
      `${FROM}..`,
      `${FROM}a/b.m3u8`,
      `${FROM}a\\b.m3u8`,
      `${FROM}`,
    ]) {
      expect(rehomedAddress(address, FROM, TO), address).toBeNull();
    }
  });
});
