import { describe, expect, it } from 'vitest';
import { brandLogoAddress } from './brandLogoAddress';

describe('brandLogoAddress', () => {
  it('names the file the logo is, so a new logo is a new address', () => {
    expect(brandLogoAddress('brand-logo-1.png')).toBe('/api/brand/logo?v=brand-logo-1.png');
  });
});
