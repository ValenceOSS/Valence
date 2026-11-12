import { describe, expect, it } from 'vitest';
import { ArtworkAddressesSchema } from './ArtworkAddresses';

describe('ArtworkAddressesSchema', () => {
  it('takes an address for any of the pictures an item has', () => {
    expect(ArtworkAddressesSchema.parse({ poster: '/api/artwork/a' })).toEqual({
      poster: '/api/artwork/a',
    });
  });

  it('refuses an empty address', () => {
    expect(ArtworkAddressesSchema.safeParse({ logo: '' }).success).toBe(false);
  });
});
