import { describe, expect, it } from 'vitest';
import { placeEpisodes } from './placeEpisodes';

const ROOT = '/tv';

/**
 * Places a few files and reads back how one of them is numbered.
 *
 * @param paths - The library's files.
 * @param path - The one to read.
 * @returns Where it was placed.
 */
const placing = (paths: string[], path: string) => placeEpisodes(paths, ROOT).get(path);

describe('placeEpisodes', () => {
  it('takes the first folder under the library as the programme, whatever is below it', () => {
    const path = '/tv/Avatar The Last Airbender/Book 1 Water/Avatar S01E01.mkv';

    expect(placing([path], path)?.episode).toMatchObject({
      seriesTitle: 'Avatar The Last Airbender',
      seriesFolder: '/tv/Avatar The Last Airbender',
      seasonNumber: 1,
      episodeNumber: 1,
    });
  });

  it('takes the programme year from its folder', () => {
    const path = '/tv/Doctor Who (2005)/Season 1/Doctor.Who.S01E01.mkv';

    expect(placing([path], path)?.episode).toMatchObject({
      seriesTitle: 'Doctor Who',
      seriesYear: 2005,
      seasonNumber: 1,
      episodeNumber: 1,
    });
  });

  it('keeps a file it cannot number as an episode of its programme and season', () => {
    const path = '/tv/Show/Season 2/Show - Pilot.mkv';

    expect(placing([path], path)?.episode).toMatchObject({
      seriesTitle: 'Show',
      seasonNumber: 2,
      episodeNumber: null,
    });
  });

  it('reads an absolute number as an episode of the first season where there is no season folder', () => {
    const path = '/tv/One Piece/One Piece - 1071.mkv';

    expect(placing([path], path)?.episode).toMatchObject({ seasonNumber: 1, episodeNumber: 1071 });
  });

  it('reads a season folder of specials as season 0', () => {
    const path = '/tv/Curb Your Enthusiasm/Specials/Curb Your Enthusiasm - Special.mkv';

    expect(placing([path], path)?.episode).toMatchObject({ seasonNumber: 0, episodeNumber: null });
  });

  it('reads a bare number in a season folder as the episode', () => {
    const path = '/tv/Show/Season 3/05 - Title.mkv';

    expect(placing([path], path)?.episode).toMatchObject({ seasonNumber: 3, episodeNumber: 5 });
  });

  it('names a loose file at the top of the library by its own name', () => {
    const path = '/tv/Loose.Show.S02E03.720p.mkv';

    expect(placing([path], path)?.episode).toMatchObject({
      seriesTitle: 'Loose Show',
      seriesFolder: null,
      seasonNumber: 2,
      episodeNumber: 3,
    });
  });

  it('reads two files of one episode as versions of it', () => {
    const paths = [
      '/tv/Show/Season 1/Show S01E01 1080p.mkv',
      '/tv/Show/Season 1/Show S01E01 2160p.mkv',
    ];
    const placed = placeEpisodes(paths, ROOT);

    expect(placed.get(paths[1] ?? '')?.version).toBeNull();
    expect(placed.get(paths[0] ?? '')?.version).toEqual({ parentPath: paths[1], label: '1080p' });
  });

  it('files extras in a programme under the programme', () => {
    const path = '/tv/Show/Featurettes/Making of.mkv';

    expect(placing([path], path)?.extra).toEqual({
      kind: 'featurette',
      parentPath: null,
      seriesFolder: '/tv/Show',
    });
  });

  it('keeps a programme called Extras a programme', () => {
    const path = '/tv/Extras (2005)/Season 1/Extras S01E01.mkv';

    expect(placing([path], path)).toMatchObject({
      extra: null,
      episode: { seriesTitle: 'Extras', seriesYear: 2005, episodeNumber: 1 },
    });
  });

  it('reads identifiers in the programme folder, and keeps them out of its name', () => {
    const path = '/tv/Seinfeld [tmdbid-1400]/Season 1/Seinfeld S01E01.mkv';

    expect(placing([path], path)).toMatchObject({
      ids: { tmdb: '1400', tvdb: null, imdb: null },
      episode: { seriesTitle: 'Seinfeld' },
      nfoPaths: ['/tv/Seinfeld [tmdbid-1400]/tvshow.nfo'],
    });
  });

  it('takes the episode title from what follows its number', () => {
    const path = '/tv/Show/Season 1/Show.S01E02.The.Second.One.1080p.WEB-DL.mkv';

    expect(placing([path], path)?.episode.episodeTitle).toBe('The Second One');
  });
});
