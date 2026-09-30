import { describe, expect, it } from 'vitest';
import { artworkOptionsOf } from './artworkOptionsOf';

const image = (path: string, language: string | null, rating = 5, votes = 1) => ({
  file_path: path,
  iso_639_1: language,
  width: 1000,
  height: 400,
  vote_average: rating,
  vote_count: votes,
});

const BASE = 'https://image.tmdb.org/t/p';

describe('artworkOptionsOf', () => {
  it('offers the house language first, then no lettering, then the original, then the rest', () => {
    const offered = artworkOptionsOf(
      [
        image('/ko.png', 'ko', 9),
        image('/ja.png', 'ja'),
        image('/none.png', null),
        image('/en.png', 'en'),
      ],
      'logo',
      BASE,
      { language: 'en', originalLanguage: 'ja' },
    );

    expect(offered.map((option) => option.language)).toEqual(['en', null, 'ja', 'ko']);
  });

  it('puts the better rated first within a language', () => {
    const offered = artworkOptionsOf(
      [image('/low.jpg', null, 4), image('/high.jpg', null, 8)],
      'backdrop',
      BASE,
    );

    expect(offered[0]?.url).toBe(`${BASE}/original/high.jpg`);
  });

  it('keeps the full picture and shows a smaller one while choosing', () => {
    const [poster] = artworkOptionsOf([image('/p.jpg', 'en')], 'poster', BASE);

    expect(poster).toEqual({
      url: `${BASE}/original/p.jpg`,
      previewUrl: `${BASE}/w342/p.jpg`,
      language: 'en',
      width: 1000,
      height: 400,
      votes: 1,
    });
  });
});
