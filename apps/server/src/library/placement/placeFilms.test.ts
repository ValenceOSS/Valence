import { describe, expect, it } from 'vitest';
import { placeFilms } from './placeFilms';

const ROOT = '/movies';

/**
 * Places a few films and reads back one of them.
 *
 * @param paths - The library's files.
 * @param path - The one to read.
 * @returns Where it was placed.
 */
const placing = (paths: string[], path: string) => placeFilms(paths, ROOT).get(path);

describe('placeFilms', () => {
  it('reads two numbered sequels in one folder as two films, not two episodes', () => {
    const paths = ['/movies/Rocky/Rocky 2 (1979).mkv', '/movies/Rocky/Rocky 3 (1982).mkv'];

    expect(placing(paths, paths[0] ?? '')).toMatchObject({ title: 'Rocky 2', year: 1979 });
    expect(placing(paths, paths[1] ?? '')).toMatchObject({ title: 'Rocky 3', year: 1982 });
    expect(placing(paths, paths[0] ?? '')?.episode.episodeNumber).toBeNull();
  });

  it('places a film kept as several files once, at its first part, holding every part', () => {
    const paths = [
      '/movies/Film (1999)/Film (1999) - cd2.mkv',
      '/movies/Film (1999)/Film (1999) - cd1.mkv',
    ];
    const placed = placeFilms(paths, ROOT);

    expect(placed.get(paths[1] ?? '')).toMatchObject({
      isIgnored: false,
      title: 'Film',
      year: 1999,
      version: null,
      parts: [paths[1], paths[0]],
    });
    expect(placed.get(paths[0] ?? '')?.isIgnored).toBe(true);
  });

  it('places a film kept as several files loose in the library by its name without the part', () => {
    const paths = ['/movies/Film (1999).part1.avi', '/movies/Film (1999).part2.avi'];
    const placed = placeFilms(paths, ROOT);

    expect(placed.get(paths[0] ?? '')).toMatchObject({ title: 'Film', year: 1999 });
    expect(placed.get(paths[0] ?? '')?.parts).toEqual(paths);
    expect(placed.get(paths[0] ?? '')?.nfoPaths).toContain('/movies/Film (1999).nfo');
    expect(placed.get(paths[1] ?? '')?.isIgnored).toBe(true);
  });

  it('keeps an extra in parts as as many extras, never joined', () => {
    const paths = [
      '/movies/Film (1999)/Film (1999).mkv',
      '/movies/Film (1999)/Featurettes/Making Of - Part 1.mkv',
      '/movies/Film (1999)/Featurettes/Making Of - Part 2.mkv',
    ];
    const placed = placeFilms(paths, ROOT);

    for (const path of paths.slice(1)) {
      expect(placed.get(path)).toMatchObject({ isIgnored: false, extra: { kind: 'featurette' } });
      expect(placed.get(path)?.parts).toBeUndefined();
    }
  });

  it('keeps another copy beside a film kept as several files as its version', () => {
    const paths = [
      '/movies/Film (1999)/Film (1999) - cd1.mkv',
      '/movies/Film (1999)/Film (1999) - cd2.mkv',
      '/movies/Film (1999)/Film (1999) - 1080p.mkv',
    ];
    const placed = placeFilms(paths, ROOT);
    const versions = [...placed.values()].filter((one) => one.version !== null);

    expect(versions).toHaveLength(1);
    expect(versions[0]?.version?.label).not.toMatch(/cd/iu);
    expect(placed.get(paths[1] ?? '')?.isIgnored).toBe(true);
  });

  it('labels a film kept as several files by its name, never by its first part', () => {
    const paths = [
      "/movies/Film (1999)/Film (1999) - Director's Cut - cd1.mkv",
      "/movies/Film (1999)/Film (1999) - Director's Cut - cd2.mkv",
      '/movies/Film (1999)/Film (1999) - 1080p.mkv',
    ];
    const placed = placeFilms(paths, ROOT);

    expect(placed.get(paths[0] ?? '')?.version?.label).toBe("Director's Cut");
  });

  it('names a Blu-ray copied whole by the folder holding its BDMV', () => {
    const paths = ['/movies/A Film (2010)/BDMV/STREAM/00800.m2ts'];

    expect(placing(paths, paths[0] ?? '')).toMatchObject({
      isIgnored: false,
      title: 'A Film',
      year: 2010,
      version: null,
    });
    expect(placing(paths, paths[0] ?? '')?.nfoPaths).toContain('/movies/A Film (2010)/movie.nfo');
  });

  it('reads the folder’s tags and movie.nfo for a Blu-ray sharing its folder with another file', () => {
    const disc = '/movies/A Film (2010) [tmdbid-329]/BDMV/STREAM/00800.m2ts';
    const other = '/movies/A Film (2010) [tmdbid-329]/A Film (2010) - Commentary.mkv';
    const placed = placeFilms([disc, other], ROOT).get(disc);

    expect(placed?.ids.tmdb).toBe('329');
    expect(placed?.nfoPaths).toContain('/movies/A Film (2010) [tmdbid-329]/movie.nfo');
  });

  it('names each film in a collection folder by its own file', () => {
    const paths = [
      '/movies/Harry Potter (2001-2011)/Harry.Potter.and.the.Chamber.of.Secrets.2002.mkv',
      '/movies/Harry Potter (2001-2011)/Harry.Potter.and.the.Prisoner.of.Azkaban.2004.mkv',
    ];

    expect(placing(paths, paths[0] ?? '')).toMatchObject({
      title: 'Harry Potter and the Chamber of Secrets',
      year: 2002,
    });
  });

  it('names a film by the folder holding just it, with or without a year', () => {
    expect(
      placing(['/movies/The Matrix/title00.mkv'], '/movies/The Matrix/title00.mkv'),
    ).toMatchObject({
      title: 'The Matrix',
    });
    expect(
      placing(['/movies/Arrival (2016)/movie.mkv'], '/movies/Arrival (2016)/movie.mkv'),
    ).toMatchObject({ title: 'Arrival', year: 2016 });
  });

  it('takes the year from the file before the folder', () => {
    expect(
      placing(
        ['/movies/Dune Part Two/Dune.Part.Two.2024.2160p.mkv'],
        '/movies/Dune Part Two/Dune.Part.Two.2024.2160p.mkv',
      ),
    ).toMatchObject({ title: 'Dune Part Two', year: 2024 });
  });

  it('reads files named after their folder with a label as versions of one film', () => {
    const paths = [
      '/movies/Heat (1995)/Heat (1995) - 1080p.mkv',
      '/movies/Heat (1995)/Heat (1995) - 2160p.mkv',
    ];
    const placed = placeFilms(paths, ROOT);

    expect(placed.get(paths[1] ?? '')?.version).toBeNull();
    expect(placed.get(paths[0] ?? '')?.version).toEqual({ parentPath: paths[1], label: '1080p' });
    expect(placed.get(paths[0] ?? '')).toMatchObject({ title: 'Heat', year: 1995 });
  });

  it('never reads a different film that starts the same way as a version', () => {
    const paths = ['/movies/Alien/Alien.mkv', '/movies/Alien/Aliens.mkv'];
    const placed = placeFilms(paths, ROOT);

    expect(placed.get(paths[1] ?? '')).toMatchObject({ title: 'Aliens', version: null });
  });

  it('never reads two films of different years as versions', () => {
    const paths = ['/movies/Dune/Dune (1984).mkv', '/movies/Dune/Dune (2021).mkv'];
    const placed = placeFilms(paths, ROOT);

    expect(placed.get(paths[0] ?? '')).toMatchObject({ year: 1984, version: null });
    expect(placed.get(paths[1] ?? '')).toMatchObject({ year: 2021, version: null });
  });

  it('keeps a film whose title is a word used for extras', () => {
    const path = '/movies/Other People (2016)/Other.People.2016.mkv';

    expect(placing([path], path)).toMatchObject({ title: 'Other People', extra: null });
  });

  it('files extras under the film they sit beside', () => {
    const film = '/movies/Heat (1995)/Heat (1995).mkv';
    const trailer = '/movies/Heat (1995)/Heat (1995)-trailer.mkv';
    const making = '/movies/Heat (1995)/Featurettes/Making of.mkv';
    const placed = placeFilms([film, trailer, making], ROOT);

    expect(placed.get(film)).toMatchObject({ title: 'Heat', extra: null });
    expect(placed.get(trailer)?.extra).toEqual({
      kind: 'trailer',
      parentPath: film,
      seriesFolder: null,
    });
    expect(placed.get(making)?.extra).toEqual({
      kind: 'featurette',
      parentPath: film,
      seriesFolder: null,
    });
  });

  it('leaves out sample files and a NAS recycle bin', () => {
    const paths = [
      '/movies/Movie.2019.1080p.BluRay-GRP/Sample/grp-movie-1080p-sample.mkv',
      '/movies/Heat (1995)/heat-sample.mkv',
      '/movies/#recycle/Old Film (2001).mkv',
    ];
    const placed = placeFilms(paths, ROOT);

    expect(paths.map((path) => placed.get(path)?.isIgnored)).toEqual([true, true, true]);
  });

  it('keeps a film whose title has the word sample in it', () => {
    const paths = ['/movies/Free Sample (2021)/Free Sample (2021).mkv', '/movies/The Sample.mkv'];
    const placed = placeFilms(paths, ROOT);

    expect(placed.get(paths[0] ?? '')).toMatchObject({ isIgnored: false, title: 'Free Sample' });
    expect(placed.get(paths[1] ?? '')?.isIgnored).toBe(false);
  });

  it('reads identifiers written into the folder and file names, and cuts them out of the title', () => {
    const path = '/movies/The Matrix (1999) [tmdbid-603]/The Matrix [imdbid-tt0133093].mkv';

    expect(placing([path], path)).toMatchObject({
      title: 'The Matrix',
      year: 1999,
      ids: { tmdb: '603', imdb: 'tt0133093', tvdb: null },
      nfoPaths: [
        '/movies/The Matrix (1999) [tmdbid-603]/movie.nfo',
        '/movies/The Matrix (1999) [tmdbid-603]/The Matrix [imdbid-tt0133093].nfo',
      ],
    });
  });

  it('cuts release noise off a loose file rather than dropping words from the title', () => {
    const paths = ["/movies/Charlotte's.Web.2006.1080p.BluRay.x264-GRP.mkv", '/movies/Other.mkv'];

    expect(placing(paths, paths[0] ?? '')).toMatchObject({ title: "Charlotte's Web", year: 2006 });
  });

  it('names a special filed as a film by its folder', () => {
    const path = '/movies/Derek Special (2015)/Derek Special.mkv';

    expect(placing([path], path)).toMatchObject({ title: 'Derek Special', year: 2015 });
  });
});
