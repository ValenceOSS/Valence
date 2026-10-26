/* oxlint-disable valence/no-hard-coded-strings -- the sites' own names, which are never translated */
const NAMES: readonly (readonly [string, string])[] = [
  ['themoviedb.org', 'TMDB'],
  ['tmdb.org', 'TMDB'],
  ['musicbrainz.org', 'MusicBrainz'],
  ['coverartarchive.org', 'Cover Art Archive'],
  ['openlibrary.org', 'Open Library'],
  ['itunes.apple.com', 'Apple Music'],
  ['deezer.com', 'Deezer'],
  ['audible.com', 'Audible'],
  ['audnex.us', 'Audnexus'],
  ['wikidata.org', 'Wikidata'],
  ['wikipedia.org', 'Wikipedia'],
  ['theaudiodb.com', 'TheAudioDB'],
  ['omdbapi.com', 'OMDb'],
  ['lrclib.net', 'LRCLIB'],
  ['anilist.co', 'AniList'],
  ['mangadex.org', 'MangaDex'],
  ['opensubtitles.com', 'OpenSubtitles'],
  ['subdl.com', 'SubDL'],
];

/**
 * Names the site an address belongs to the way a person would know it, so a failure can say which
 * one it was.
 *
 * @param url - An address on the site.
 * @returns Its name, its host where it is not one Valence knows by name, or the address itself
 *   where it is not one at all.
 */
const nameOfSource = (url: string): string => {
  if (!URL.canParse(url)) {
    return url;
  }

  const { host } = new URL(url);

  return NAMES.find(([domain]) => host === domain || host.endsWith(`.${domain}`))?.[1] ?? host;
};

export { nameOfSource };
