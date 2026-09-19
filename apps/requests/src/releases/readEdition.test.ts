import { describe, expect, it } from 'vitest';
import { readEdition } from './readEdition';

describe('readEdition', () => {
  it.each([
    ['Movie 2001 EXTENDED 1080p', 'EXTENDED'],
    ["Movie Director's Cut", "Director's Cut"],
    ['Movie IMAX 2160p', 'IMAX'],
    ['Album (50th Anniversary Edition) (2023)', '50th Anniversary Edition'],
    ["Album (Taylor's Version)", "Taylor's Version"],
    ['Album Super Deluxe', 'Super Deluxe'],
  ])('reads %s as %s', (name, edition) => {
    expect(readEdition(name)).toBe(edition);
  });

  it('says nothing where a name does not', () => {
    expect(readEdition('Movie 2020 1080p')).toBeNull();
  });
});
