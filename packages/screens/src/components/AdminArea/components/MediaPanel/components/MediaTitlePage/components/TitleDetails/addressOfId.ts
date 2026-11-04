type IdSite = 'tmdb' | 'imdbId' | 'tvdbId';

const IMDB = /^tt\d+$/u;

const NUMBER = /^\d+$/u;

/**
 * Where a title's page is on the site one of its ids belongs to, for opening it there.
 *
 * @param site - Which site the id belongs to.
 * @param id - The id.
 * @param isShow - Whether the title is a programme rather than a film.
 * @returns The address, or nothing where the id is not one the site would know.
 */
const addressOfId = (site: IdSite, id: string, isShow: boolean): string | null => {
  const said = id.trim();

  if (site === 'imdbId') {
    return IMDB.test(said) ? `https://www.imdb.com/title/${said}/` : null;
  }

  if (!NUMBER.test(said)) {
    return null;
  }

  return site === 'tmdb'
    ? `https://www.themoviedb.org/${isShow ? 'tv' : 'movie'}/${said}`
    : `https://thetvdb.com/dereferrer/${isShow ? 'series' : 'movie'}/${said}`;
};

export type { IdSite };

export { addressOfId };
