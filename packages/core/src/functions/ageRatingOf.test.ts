import { describe, expect, it } from 'vitest';
import { ageRatingOf } from './ageRatingOf';

describe('ageRatingOf', () => {
  it("shows a British certificate with the BBFC's own mark", () => {
    expect(ageRatingOf('GB', '15')).toEqual({
      said: '15',
      picture: 'bbfc-15',
      label: 'Rated 15 by the BBFC',
    });
  });

  it('reads a certificate whatever its case and spacing', () => {
    expect(ageRatingOf(' gb ', ' 12a ').picture).toBe('bbfc-12a');
  });

  it("shows an American film with the MPA's mark and American television with its own", () => {
    expect(ageRatingOf('US', 'PG-13').picture).toBe('mpa-pg-13');
    expect(ageRatingOf('US', 'TV-MA').picture).toBe('tv-ma');
  });

  it('reads the German and Dutch certificates with or without their board written in front', () => {
    expect(ageRatingOf('DE', 'FSK 16').picture).toBe('fsk-16');
    expect(ageRatingOf('NL', '12').picture).toBe('kijkwijzer-12');
  });

  it('writes out a certificate its board issues no mark for, rather than making one up', () => {
    expect(ageRatingOf('IE', '16')).toEqual({
      said: '16',
      picture: null,
      label: 'Rated 16 by the IFCO',
    });
  });

  it('names no board for a country it does not know', () => {
    expect(ageRatingOf('JP', 'G')).toEqual({ said: 'G', picture: null, label: 'Rated G' });
  });
});
