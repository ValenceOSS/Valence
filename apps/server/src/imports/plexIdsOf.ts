import { NO_IDS } from './NO_IDS';
import type { SourceIds } from './SourceReader';

const MODERN = /^(imdb|tmdb|tvdb|mbid):\/\/(.+)$/i;

const LEGACY = /^com\.plexapp\.agents\.(imdb|themoviedb|thetvdb|musicbrainz):\/\/([^/?]+)/i;

const FIELDS: Readonly<Record<string, keyof SourceIds>> = {
  imdb: 'imdb',
  tmdb: 'tmdb',
  themoviedb: 'tmdb',
  tvdb: 'tvdb',
  thetvdb: 'tvdb',
};

/**
 * Reads the catalogue identifiers of a Plex item, from its `Guid` list where the new agents wrote
 * one and from its legacy agent `guid` otherwise.
 *
 * @param item - The item's `guid` and `Guid` entries.
 * @param musicField - Which MusicBrainz identifier an `mbid://` entry is, for this kind of item.
 * @returns The identifiers Valence matches on.
 */
const plexIdsOf = (
  item: { guid?: string | undefined; Guid?: readonly { id: string }[] | undefined },
  musicField: keyof SourceIds | null = null,
): SourceIds => {
  const ids: SourceIds = { ...NO_IDS };
  const place = (scheme: string, value: string) => {
    const lower = scheme.toLowerCase();
    const field =
      lower === 'mbid' || lower === 'musicbrainz' ? musicField : (FIELDS[lower] ?? null);

    if (field !== null && ids[field] === null && value.trim() !== '') {
      ids[field] = value.trim();
    }
  };

  for (const entry of item.Guid ?? []) {
    const [, scheme = '', value = ''] = MODERN.exec(entry.id) ?? [];

    place(scheme, value);
  }

  const [, scheme = '', value = ''] = LEGACY.exec(item.guid ?? '') ?? [];

  place(scheme, value);

  return ids;
};

export { plexIdsOf };
