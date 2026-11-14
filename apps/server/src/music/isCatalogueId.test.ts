import { describe, expect, it } from 'vitest';
import { isCatalogueId } from './isCatalogueId';

describe('isCatalogueId', () => {
  it('accepts a UUID', () => {
    expect(isCatalogueId('2f1a6c52-8a2e-4f0b-9c55-0d1f8b2f6a11')).toBe(true);
  });

  it('refuses anything else, which would only fill the cache with names nobody has', () => {
    expect(isCatalogueId('rg-1')).toBe(false);
    expect(isCatalogueId('')).toBe(false);
    expect(isCatalogueId('../../x')).toBe(false);
  });
});
