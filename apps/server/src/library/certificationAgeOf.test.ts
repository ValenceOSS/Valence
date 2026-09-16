import { describe, expect, it } from 'vitest';
import { certificationAgeOf } from './certificationAgeOf';

const HELD = { GB: '15', US: 'R', DE: '16' };

describe('the age an item is certificated for here', () => {
  it('reads the certificate for the region this server uses', () => {
    expect(certificationAgeOf('GB', HELD)).toBe(15);
    expect(certificationAgeOf('US', HELD)).toBe(17);
    expect(certificationAgeOf('DE', HELD)).toBe(16);
  });

  it('does not fall back to another country, a 15 not being an R', () => {
    expect(certificationAgeOf('FR', HELD)).toBeNull();
  });

  it('says nothing where the catalogue held none at all', () => {
    expect(certificationAgeOf('GB', null)).toBeNull();
    expect(certificationAgeOf('GB', {})).toBeNull();
  });

  it('says nothing rather than zero, unrated and suitable-for-all being different answers', () => {
    expect(certificationAgeOf('GB', { GB: 'TBC' })).toBeNull();
    expect(certificationAgeOf('GB', { GB: 'U' })).toBe(0);
  });

  it('does not care how the region was written', () => {
    expect(certificationAgeOf(' gb ', HELD)).toBe(15);
  });
});
