import { randomBytes } from 'node:crypto';
import { hashOfRelease } from '@ValenceCore/releases/hashOfRelease';
import { parseReleaseName } from '@ValenceCore/releases/parseReleaseName';
import { RESOLUTIONS } from '@ValenceContracts/schemas/ParsedRelease';
import type { Release } from '@ValenceContracts/schemas/Indexer';
import type { StreamOffer, StreamOffers } from '@ValenceContracts/schemas/StreamOffer';
import { SaidError } from '@ValenceI18n/SaidError';
import type { Said } from '@ValenceI18n/SaidSchema';
import { saying } from '@ValenceI18n/saying';
import { MOST_CANDIDATES } from '@ValenceSDK/sources/StreamsAskSchema';
import type { StreamsAsk } from '@ValenceSDK/sources/StreamsAskSchema';
import type { Stream } from '@ValenceSDK/sources/StreamSchema';
import type { StreamTitle } from '@ValenceSDK/sources/StreamTitleSchema';
import { createExpiringCache } from '@ValenceServer/library/createExpiringCache';
import type { PluginSource } from '@ValenceServer/plugins/service/createContributionCalls';

type OfferedSource = { pluginId: string; sourceId: string; title: string };

type HeldOffer = {
  pluginId: string;
  sourceId: string;
  sourceName: string;
  stream: Stream;
  title: StreamTitle;
};

type CreateStreamOffersOptions = {
  sources: () => Promise<readonly OfferedSource[]>;
  askSource: (pluginId: string, sourceId: string) => Pick<PluginSource, 'streams'>;
  searchReleases: (title: StreamTitle) => Promise<readonly Release[]>;
  patienceMs?: number;
  now?: () => number;
};

const TITLES_KEPT_FOR_MS = 10 * 60 * 1000;

const PARTLY_KEPT_FOR_MS = 60 * 1000;

const OFFERS_KEPT_FOR_MS = 30 * 60 * 1000;

const PATIENCE_MS = 20_000;

/**
 * The torrents an indexer search found, as candidates a source is asked about: each once, by its
 * hash, the copy with the most seeders kept, the best seeded first.
 *
 * @param releases - What the search found.
 * @returns The candidates.
 */
const candidatesOf = (releases: readonly Release[]): StreamsAsk['candidates'] => {
  const byHash = new Map<string, StreamsAsk['candidates'][number]>();

  for (const release of releases) {
    const infoHash = hashOfRelease(release);

    if (infoHash === null) {
      continue;
    }

    const kept = byHash.get(infoHash);

    if (kept === undefined || (release.seeders ?? 0) > (kept.seeders ?? 0)) {
      byHash.set(infoHash, {
        infoHash,
        name: release.title,
        sizeBytes: release.sizeBytes === null ? null : Math.round(release.sizeBytes),
        seeders: release.seeders,
      });
    }
  }

  return [...byHash.values()]
    .toSorted((one, other) => (other.seeders ?? 0) - (one.seeders ?? 0))
    .slice(0, MOST_CANDIDATES);
};

/**
 * Where an offer sorts: ready first, then the sharper picture, then the better seeded.
 *
 * @param offer - The offer.
 * @returns Its place, lower first.
 */
const placeOf = (offer: StreamOffer): number[] => [
  offer.isReady ? 0 : 1,
  offer.resolution === null ? RESOLUTIONS.length : RESOLUTIONS.indexOf(offer.resolution),
  -(offer.seeders ?? 0),
];

/**
 * What can play a film straight from the sources plugins offer: Valence searches its indexers for
 * the film, hands every source the torrents it found by their hashes, and each source says which
 * it can play and may add streams of its own. What each offers is read for its quality from its
 * name, and kept for a while under an id nobody can guess, so playing one names it by that id
 * alone. A source that does not answer in time, or fails, is left out and said to have been, and
 * the others are answered regardless. What a film is offered is kept for a few minutes, so a
 * second look is instant and asks no plugin again — or for only a minute where a source could
 * not say, so it is soon asked again. Looks at a film while one is under way share it.
 *
 * @param options - Which sources there are, how to ask one, and how to search the indexers.
 * @returns The offers.
 */
const createStreamOffers = ({
  sources,
  askSource,
  searchReleases,
  patienceMs = PATIENCE_MS,
  now = Date.now,
}: CreateStreamOffersOptions) => {
  const titles = createExpiringCache<StreamOffers>(TITLES_KEPT_FOR_MS, { holds: 200, now });
  const partly = createExpiringCache<StreamOffers>(PARTLY_KEPT_FOR_MS, { holds: 200, now });
  const looking = new Map<string, Promise<StreamOffers>>();
  const held = createExpiringCache<HeldOffer>(OFFERS_KEPT_FOR_MS, { holds: 20_000, now });

  const ask = async (
    source: OfferedSource,
    title: StreamTitle,
    candidates: StreamsAsk['candidates'],
  ): Promise<{ streams: readonly Stream[]; problem: Said | null }> => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const late = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        reject(
          new SaidError(
            saying('server.streamSources.createStreamOffers.sourceDidNotAnswerInTime', {
              source: source.title,
            }),
          ),
        );
      }, patienceMs);
    });

    try {
      const answer = await Promise.race([
        askSource(source.pluginId, source.sourceId).streams({ title, candidates }),
        late,
      ]);

      return { streams: answer.streams, problem: null };
    } catch (error) {
      return {
        streams: [],
        problem:
          error instanceof SaidError
            ? error.said
            : saying('server.streamSources.createStreamOffers.sourceDidNotAnswerInTime', {
                source: source.title,
              }),
      };
    } finally {
      clearTimeout(timer);
    }
  };

  const look = async (title: StreamTitle): Promise<StreamOffers> => {
    const offered = await sources();

    if (offered.length === 0) {
      return { offers: [], problems: [] };
    }

    const candidates = candidatesOf(await searchReleases(title).catch(() => []));
    const seeded = new Map(candidates.map((candidate) => [candidate.infoHash, candidate.seeders]));
    const answers = await Promise.all(
      offered.map(async (source) => ({ source, ...(await ask(source, title, candidates)) })),
    );
    const offers = answers
      .flatMap(({ source, streams }) =>
        streams.map((stream): StreamOffer => {
          const id = randomBytes(18).toString('base64url');
          const parsed = parseReleaseName(stream.fileName ?? stream.name);

          held.set(id, {
            pluginId: source.pluginId,
            sourceId: source.sourceId,
            sourceName: source.title,
            stream,
            title,
          });

          return {
            id,
            sourceName: source.title,
            name: stream.name,
            fileName: stream.fileName,
            sizeBytes: stream.sizeBytes,
            isReady: stream.isReady,
            seeders: stream.infoHash === null ? null : (seeded.get(stream.infoHash) ?? null),
            resolution: parsed.resolution,
            source: parsed.source,
            codec: parsed.codec,
            hdr: parsed.hdr,
            audio: parsed.audio,
            languages: parsed.languages,
            group: parsed.group,
          };
        }),
      )
      .toSorted((one, other) => {
        const [first, second] = [placeOf(one), placeOf(other)];

        return first.reduce((order, place, at) => order || place - (second[at] ?? 0), 0);
      });
    const found: StreamOffers = {
      offers,
      problems: answers.flatMap(({ problem }) => (problem === null ? [] : [problem])),
    };

    (found.problems.length === 0 ? titles : partly).set(title.catalogueId, found);

    return found;
  };

  return {
    offersFor: (title: StreamTitle, isFresh = false): Promise<StreamOffers> => {
      const cached = isFresh
        ? undefined
        : (titles.get(title.catalogueId) ?? partly.get(title.catalogueId));

      if (cached !== undefined) {
        return Promise.resolve(cached);
      }

      const already = looking.get(title.catalogueId);

      if (already !== undefined) {
        return already;
      }

      const found = look(title).finally(() => {
        looking.delete(title.catalogueId);
      });

      looking.set(title.catalogueId, found);

      return found;
    },

    held: (streamId: string): HeldOffer | null => held.get(streamId) ?? null,
  };
};

type StreamOffersService = ReturnType<typeof createStreamOffers>;

export type { HeldOffer, OfferedSource, StreamOffersService };

export { createStreamOffers };
