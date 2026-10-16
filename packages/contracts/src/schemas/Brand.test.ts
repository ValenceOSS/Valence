import { describe, expect, it } from 'vitest';
import { BrandSchema, BrandSettingsSchema, NO_BRAND } from './Brand';

describe('BrandSettingsSchema', () => {
  it('reads a name, an accent and a description, any of them left as Valence’s own', () => {
    expect(BrandSettingsSchema.parse({ name: ' Home Cinema ', accent: '#ff6600' })).toEqual({
      name: 'Home Cinema',
      accent: '#ff6600',
      description: null,
    });
  });

  it('refuses an accent that is not a colour', () => {
    expect(BrandSettingsSchema.safeParse({ accent: 'orange' }).success).toBe(false);
  });
});

describe('BrandSchema', () => {
  it('is Valence’s own until somebody says otherwise', () => {
    expect(BrandSchema.parse({})).toEqual(NO_BRAND);
  });
});
