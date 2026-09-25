import type { ExternalIds } from './ExternalIds.types';

const UNIQUE_ID =
  /<uniqueid\b[^>]*\btype\s*=\s*["']?(?<type>tmdb|imdb|tvdb)["']?[^>]*>\s*(?<value>[^<\s]+)\s*<\/uniqueid>/giu;

const NAMED_TAG = /<(?<tag>tmdbid|imdbid|imdb_id|tvdbid)>\s*(?<value>[^<\s]+)\s*<\/\k<tag>>/giu;

const PLAIN_ID = /<id>\s*(?<value>tt\d{7,8})\s*<\/id>/iu;

const IMDB_LINK = /imdb\.com\/title\/(?<value>tt\d{7,8})/iu;

const TMDB_LINK = /themoviedb\.org\/(?:movie|tv)\/(?<value>\d+)/iu;

const TVDB_LINK = /thetvdb\.com\/[^\s<]*?(?:id=|series\/)(?<value>\d+)/iu;

/**
 * Reads the catalogue identifiers an `.nfo` file beside a film or programme holds — written by
 * Jellyfin, Kodi, Sonarr or Radarr as `<uniqueid type="tmdb">`, `<tmdbid>`, `<imdbid>` or a bare
 * link — so a library that was already matched is not matched again from its file names.
 *
 * @param text - The file's contents.
 * @returns The identifiers it holds.
 */
const readNfoIds = (text: string): ExternalIds => {
  const found: ExternalIds = { tmdb: null, imdb: null, tvdb: null };

  for (const match of text.matchAll(UNIQUE_ID)) {
    const type = match.groups?.type?.toLowerCase();
    const value = match.groups?.value ?? null;

    if ((type === 'tmdb' || type === 'imdb' || type === 'tvdb') && found[type] === null) {
      found[type] = value;
    }
  }

  for (const match of text.matchAll(NAMED_TAG)) {
    const tag = match.groups?.tag?.toLowerCase();
    const value = match.groups?.value ?? null;
    const type = tag === 'tmdbid' ? 'tmdb' : tag === 'tvdbid' ? 'tvdb' : 'imdb';

    if (found[type] === null) {
      found[type] = value;
    }
  }

  return {
    tmdb: found.tmdb ?? TMDB_LINK.exec(text)?.groups?.value ?? null,
    imdb:
      found.imdb ??
      PLAIN_ID.exec(text)?.groups?.value ??
      IMDB_LINK.exec(text)?.groups?.value ??
      null,
    tvdb: found.tvdb ?? TVDB_LINK.exec(text)?.groups?.value ?? null,
  };
};

export { readNfoIds };
