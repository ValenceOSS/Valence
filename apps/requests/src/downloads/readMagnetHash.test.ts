import { describe, expect, it } from 'vitest';
import { readMagnetHash } from './readMagnetHash';

describe('readMagnetHash', () => {
  it('reads a hex hash, in lower case', () => {
    expect(
      readMagnetHash('magnet:?xt=urn:btih:C12FE1C06BBA254A9DC9F519B335AA7C1367A88A&dn=Dune'),
    ).toBe('c12fe1c06bba254a9dc9f519b335aa7c1367a88a');
  });

  it('reads a base32 hash as hex', () => {
    expect(readMagnetHash('magnet:?dn=Dune&xt=urn:btih:YEX6DQDLXISUVHOJ6UM3GNNKPQJWPKEK')).toBe(
      'c12fe1c06bba254a9dc9f519b335aa7c1367a88a',
    );
  });

  it('finds nothing in a link without a hash', () => {
    expect(readMagnetHash('magnet:?dn=Dune')).toBeNull();
    expect(readMagnetHash('magnet:?xt=urn:btih:abc')).toBeNull();
    expect(readMagnetHash('magnet:?xt=urn:btih:YEX6DQDLXISUVHOJ6UM3GNNKPQJWPKE1')).toBeNull();
  });
});
