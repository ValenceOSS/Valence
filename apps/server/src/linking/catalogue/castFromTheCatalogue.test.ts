import { describe, expect, it } from 'vitest';
import { castFromTheCatalogue } from './castFromTheCatalogue';

describe('castFromTheCatalogue', () => {
  it('keeps a picture from the catalogue', () => {
    const cast = [
      { name: 'Amy Adams', role: 'Louise', imageUrl: 'https://image.tmdb.org/t/p/w185/a.jpg' },
    ];

    expect(castFromTheCatalogue(cast)).toEqual(cast);
  });

  it('drops a picture from anywhere else, which would tell another server who is looking', () => {
    expect(
      castFromTheCatalogue([
        { name: 'Amy Adams', role: 'Louise', imageUrl: 'https://tracker.example/pixel.gif' },
        { name: 'Jeremy Renner', role: 'Ian', imageUrl: 'https://image.tmdb.org.evil/t/p/x.jpg' },
        { name: 'Forest Whitaker', role: 'Weber', imageUrl: 'http://image.tmdb.org/t/p/x.jpg' },
        { name: 'Michael Stuhlbarg', role: 'Halpern', imageUrl: null },
      ]),
    ).toEqual([
      { name: 'Amy Adams', role: 'Louise', imageUrl: null },
      { name: 'Jeremy Renner', role: 'Ian', imageUrl: null },
      { name: 'Forest Whitaker', role: 'Weber', imageUrl: null },
      { name: 'Michael Stuhlbarg', role: 'Halpern', imageUrl: null },
    ]);
  });

  it('keeps nothing of a cast it cannot read', () => {
    expect(castFromTheCatalogue('not a cast')).toBeNull();
    expect(castFromTheCatalogue(null)).toBeNull();
    expect(castFromTheCatalogue(undefined)).toBeNull();
  });
});
