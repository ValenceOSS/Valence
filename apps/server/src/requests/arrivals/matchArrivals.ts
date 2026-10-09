import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import type {
  HeldEpisode,
  MediaRequest,
  MediaRequestArrivals,
} from '@ValenceContracts/schemas/MediaRequest';
import type { MusicQuality } from '@ValenceContracts/schemas/ParsedRelease';
import type { CatalogueLookup } from '@ValenceServer/requests/catalogue/CatalogueLookup';

type Arrival = { request: MediaRequest; arrivals: MediaRequestArrivals };

const LOSSLESS = new Set<MusicQuality>(['flac24', 'flac', 'alac']);

type MatchArrivalsOptions = {
  requests: readonly MediaRequest[];
  lookup: Pick<CatalogueLookup, 'films' | 'series' | 'albums' | 'albumQualities'>;
  heldEpisodes: (tmdbId: string) => Promise<readonly HeldEpisode[]>;
};

/**
 * What the libraries now hold of every approved request still waiting on something: a film or a
 * series by its catalogue id, each episode by its season and number, and an album by its
 * MusicBrainz release group — however it got there, whether Valence filed it, a connected app
 * imported it, or somebody put it there by hand. An album counts only lossless where the request
 * upgrades lossy copies to lossless.
 *
 * @param requests - Every request.
 * @param lookup - The libraries, looked into by catalogue ids.
 * @param heldEpisodes - The episodes the libraries hold of a series.
 * @returns Each request that has something newly there, and what.
 */
const matchArrivals = async ({
  requests,
  lookup,
  heldEpisodes,
}: MatchArrivalsOptions): Promise<Arrival[]> => {
  const matched: Arrival[] = [];

  for (const request of requests) {
    const waiting = request.items.filter((item) => item.state !== 'available');

    if (request.approval !== 'approved' || waiting.length === 0 || request.kind === 'book') {
      continue;
    }

    if (isMusicRequest(request.kind)) {
      const wanted = waiting.flatMap((item) =>
        item.musicBrainzId === null ? [] : [item.musicBrainzId],
      );
      const held = await lookup.albums(wanted);
      const lossless =
        request.upgradesToLossless === true
          ? new Set(
              [...(await lookup.albumQualities(wanted))].flatMap(([id, quality]) =>
                LOSSLESS.has(quality) ? [id] : [],
              ),
            )
          : null;
      const albums = new Map([...held].filter(([id]) => lossless === null || lossless.has(id)));
      const [first] = albums.values();

      if (first !== undefined) {
        matched.push({
          request,
          arrivals: { mediaId: first, episodes: null, albums: [...albums.keys()] },
        });
      }

      continue;
    }

    if (request.tmdbId === null) {
      continue;
    }

    const tmdbId = request.tmdbId.toString();

    if (request.kind === 'film') {
      const mediaId = (await lookup.films([tmdbId])).get(tmdbId);

      if (mediaId !== undefined) {
        matched.push({ request, arrivals: { mediaId, episodes: null, albums: null } });
      }

      continue;
    }

    const mediaId = (await lookup.series([tmdbId])).get(tmdbId);

    if (mediaId === undefined) {
      continue;
    }

    const held = (await heldEpisodes(tmdbId)).filter((one) =>
      waiting.some((item) => item.season === one.season && item.episode === one.episode),
    );

    if (held.length > 0) {
      matched.push({ request, arrivals: { mediaId, episodes: held, albums: null } });
    }
  }

  return matched;
};

export type { Arrival };

export { matchArrivals };
