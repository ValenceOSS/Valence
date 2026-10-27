import { describe, expect, it } from 'vitest';
import { hashOfRelease } from './hashOfRelease';

const HASH = 'c12fe1c06bba254a9dc9f519b335aa7c1367a88a';

describe('hashOfRelease', () => {
  it('takes the hash the indexer gave, in lower case', () => {
    expect(
      hashOfRelease({ protocol: 'torrent', infoHash: HASH.toUpperCase(), magnetUrl: null }),
    ).toBe(HASH);
  });

  it('reads it from the magnet link where the indexer gave none', () => {
    expect(
      hashOfRelease({
        protocol: 'torrent',
        infoHash: null,
        magnetUrl: `magnet:?xt=urn:btih:${HASH}&dn=Something`,
      }),
    ).toBe(HASH);
  });

  it('has none for a usenet release, or a torrent that carries none', () => {
    expect(hashOfRelease({ protocol: 'usenet', infoHash: HASH, magnetUrl: null })).toBeNull();
    expect(hashOfRelease({ protocol: 'torrent', infoHash: null, magnetUrl: null })).toBeNull();
  });
});
