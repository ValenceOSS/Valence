import { NO_IDS } from './NO_IDS';
import type { SourceIds } from './SourceReader';

const KEYS: Readonly<Record<string, keyof SourceIds>> = {
  tmdb: 'tmdb',
  imdb: 'imdb',
  tvdb: 'tvdb',
  musicbrainztrack: 'musicBrainzTrack',
  musicbrainzrecording: 'musicBrainzTrack',
  musicbrainzalbum: 'musicBrainzAlbum',
  musicbrainzreleasegroup: 'musicBrainzReleaseGroup',
  musicbrainzartist: 'musicBrainzArtist',
  musicbrainzalbumartist: 'musicBrainzArtist',
};

/**
 * Reads the catalogue identifiers a Jellyfin or Emby item carries, whatever case a plugin wrote
 * their names in.
 *
 * @param providerIds - The item's `ProviderIds`.
 * @returns The identifiers Valence matches on, each null where the item has none.
 */
const providerIdsOf = (
  providerIds: Readonly<Record<string, string | null>> | null | undefined,
): SourceIds => {
  const ids: SourceIds = { ...NO_IDS };

  for (const [key, value] of Object.entries(providerIds ?? {})) {
    const field = KEYS[key.toLowerCase()];
    const trimmed = value?.trim() ?? '';

    if (field !== undefined && trimmed !== '' && ids[field] === null) {
      ids[field] = trimmed;
    }
  }

  return ids;
};

export { providerIdsOf };
