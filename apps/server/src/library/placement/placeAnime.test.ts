import { describe, expect, it } from 'vitest';
import { placeAnime } from './placeAnime';

describe('placeAnime', () => {
  it("places a show's episodes as a show", () => {
    const paths = [
      '/anime/Show (2020)/Season 01/Show - S01E01.mkv',
      '/anime/Show (2020)/Show - 02.mkv',
    ];
    const placed = placeAnime(paths, '/anime');

    expect(placed.get(paths[0] ?? '')?.episode.seriesFolder).toBe('/anime/Show (2020)');
    expect(placed.get(paths[1] ?? '')?.episode.seriesFolder).toBe('/anime/Show (2020)');
  });

  it('places a film beside the shows as a film, with its extras', () => {
    const film = '/anime/Show the Film (2022)/Show the Film (2022) - 1080p.mkv';
    const trailer = '/anime/Show the Film (2022)/Trailers/Trailer.mkv';
    const placed = placeAnime([film, trailer, '/anime/Show (2020)/Show - 01.mkv'], '/anime');

    expect(placed.get(film)).toMatchObject({ title: 'Show the Film', year: 2022, extra: null });
    expect(placed.get(film)?.episode.seriesFolder).toBeNull();
    expect(placed.get(trailer)?.extra?.kind).toBe('trailer');
  });

  it('takes a folder whose files number episodes for a show, year or not', () => {
    const path = '/anime/Show (2020)/[Group] Show - 01 [1080p].mkv';

    expect(placeAnime([path], '/anime').get(path)?.episode.seriesFolder).toBe('/anime/Show (2020)');
  });
});
