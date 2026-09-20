import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import type {
  MediaRequestKind,
  MusicRequestKind,
  RequestCatalogue,
  VideoRequestKind,
} from '@ValenceContracts/schemas/MediaRequest';

type CatalogueSources = {
  describeForRequest: (tmdbId: number, kind: VideoRequestKind) => Promise<RequestCatalogue | null>;
  describeMusicForRequest: (
    musicBrainzId: string,
    kind: MusicRequestKind,
  ) => Promise<RequestCatalogue | null>;
};

/**
 * What the catalogue says of something asked for: TMDB of a film or a series, by its TMDB id, and
 * MusicBrainz of an artist or an album, by its MusicBrainz id.
 *
 * @param sources - How each catalogue is asked.
 * @param asked - What was asked for, and the id its kind is found by.
 * @returns What the catalogue says, or null where it lacks the id, does not know it, or cannot be
 *   asked.
 */
const catalogueForRequest = (
  sources: CatalogueSources,
  asked: {
    kind: MediaRequestKind;
    tmdbId?: number | null | undefined;
    musicBrainzId?: string | null | undefined;
  },
): Promise<RequestCatalogue | null> => {
  if (isMusicRequest(asked.kind)) {
    return asked.musicBrainzId === undefined || asked.musicBrainzId === null
      ? Promise.resolve(null)
      : sources.describeMusicForRequest(asked.musicBrainzId, asked.kind);
  }

  return asked.tmdbId === undefined || asked.tmdbId === null
    ? Promise.resolve(null)
    : sources.describeForRequest(asked.tmdbId, asked.kind);
};

export type { CatalogueSources };

export { catalogueForRequest };
