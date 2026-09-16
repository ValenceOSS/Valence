import { describe, expect, it } from 'vitest';
import { certificationAge } from './certificationAge';

describe('reading a certificate as an age', () => {
  it.each([
    ['U', 0],
    ['PG', 8],
    ['12', 12],
    ['12A', 12],
    ['15', 15],
    ['18', 18],
    ['R18', 18],
  ])('reads the British %s', (said, expected) => {
    expect(certificationAge('GB', said)).toBe(expected);
  });

  it.each([
    ['G', 0],
    ['PG-13', 13],
    ['R', 17],
    ['NC-17', 18],
  ])('reads the American %s', (said, expected) => {
    expect(certificationAge('US', said)).toBe(expected);
  });

  it.each([
    ['TV-Y', 0],
    ['TV-14', 14],
    ['TV-MA', 17],
  ])('reads the American television grade %s', (said, expected) => {
    expect(certificationAge('US', said)).toBe(expected);
  });

  it.each([
    ['DE', '16', 16],
    ['FR', '12', 12],
    ['NL', '6', 6],
    ['FI', '18', 18],
  ])(
    'reads %s %s straight off, most of the world naming them after the age',
    (region, said, expected) => {
      expect(certificationAge(region, said)).toBe(expected);
    },
  );

  it('reads a trailing plus, which some systems write and some do not', () => {
    expect(certificationAge('RU', '18+')).toBe(18);
  });

  it('does not care about case or stray spaces', () => {
    expect(certificationAge('gb', ' 12a ')).toBe(12);
  });
});

describe('what it refuses to read', () => {
  it('says nothing for a certificate it does not know', () => {
    expect(certificationAge('GB', 'TBC')).toBeNull();
  });

  it('says nothing for an empty certificate, which is what an unrated item has', () => {
    expect(certificationAge('GB', '')).toBeNull();
    expect(certificationAge('GB', '   ')).toBeNull();
  });

  it('says nothing for an American NR, which means unrated rather than young', () => {
    expect(certificationAge('US', 'NR')).toBeNull();
  });

  it('does not read a British certificate in an American system', () => {
    expect(certificationAge('US', 'U')).toBeNull();
  });

  it('does not read an American certificate in a British system', () => {
    expect(certificationAge('GB', 'PG-13')).toBeNull();
  });

  it('says nothing for a region it has never heard of and a letter it cannot parse', () => {
    expect(certificationAge('ZZ', 'SOMETHING')).toBeNull();
  });

  it('refuses a number that is not an age', () => {
    expect(certificationAge('DE', '1999')).toBeNull();
  });
});
