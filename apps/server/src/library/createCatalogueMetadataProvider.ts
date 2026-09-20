import { wait } from '@ValenceCore/functions/wait';
import { z } from 'zod';
import { createExpiringCache } from './createExpiringCache';
import { CAST_STORED } from '@ValenceContracts/schemas/Person';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import { readTitleFromPath } from './readTitleFromPath';
import { pickLogo } from './pickLogo';
import { createCatalogueGate } from './createCatalogueGate';
import type {
  CastMember,
  CatalogueList,
  CatalogueMatch,
  Metadata,
  MetadataProvider,
} from './MetadataProvider';
import { readCertifications } from '@ValenceServer/library/readCertifications';
import { readRequestCatalogue } from '@ValenceServer/library/readRequestCatalogue';

const DEFAULT_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Decides which kind of credential an operator pasted, since the catalogue takes both an older key
 * and a newer token and they are sent in different places — one as a query parameter, one as a
 * bearer header.
 *
 * @param key - What the operator configured.
 * @returns Whether it is the newer kind.
 */
const isAccessToken = (key: string): boolean => key.split('.').length === 3 && key.startsWith('ey');

const DEFAULT_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const RETRIES = 3;

const AT_ONCE = 4;

const REMEMBERED = 4000;

const BACKOFF_MILLISECONDS = 500;

const TOO_MANY = 429;

/**
 * Decides whether asking the catalogue again could produce a different answer. A rate limit or a
 * server fault will pass; a bad key or a film that does not exist will not, and retrying those only
 * makes a scan slower.
 *
 * @param status - What the catalogue answered with.
 * @returns Whether the request is worth repeating.
 */
const isWorthRetrying = (status: number): boolean => status === TOO_MANY || status >= 500;

const PersonResponseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  profile_path: z.string().nullish(),
  biography: z.string().nullish(),
  birthday: z.string().nullish(),
  place_of_birth: z.string().nullish(),
});

const SearchResultSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  name: z.string().optional(),
  original_title: z.string().optional(),
  original_name: z.string().optional(),
  release_date: z.string().optional(),
  first_air_date: z.string().optional(),
  overview: z.string().optional(),
  poster_path: z.string().nullish(),
  backdrop_path: z.string().nullish(),
  vote_average: z.number().optional(),
});

const SearchResponseSchema = z.object({
  results: z.array(SearchResultSchema).default([]),
  total_pages: z.number().int().nonnegative().default(1),
});

const CompanyResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  logo_path: z.string().nullish(),
});

const CATALOGUE_ANSWER_LIVES_FOR_MS = 6 * 60 * 60 * 1000;

const LIST_PATHS: Readonly<Record<CatalogueList, Record<'tv' | 'movie', string>>> = {
  trending: { movie: '/trending/movie/week', tv: '/trending/tv/week' },
  popular: { movie: '/movie/popular', tv: '/tv/popular' },
  upcoming: { movie: '/movie/upcoming', tv: '/tv/on_the_air' },
};

const STUDIO_IDS = [2, 420, 174, 33, 4, 5, 127928, 3, 1, 521, 10342, 41077] as const;

const CAST_DESCRIBED = 12;

const LogoSchema = z.object({
  file_path: z.string(),
  iso_639_1: z.string().nullish(),
  width: z.number().default(0),
  vote_average: z.number().default(0),
  vote_count: z.number().default(0),
});

const ImagesResponseSchema = z.object({ logos: z.array(LogoSchema).default([]) });

type SearchResult = z.infer<typeof SearchResultSchema>;

const SeasonResponseSchema = z.object({
  episodes: z
    .array(
      z.object({
        episode_number: z.number().int(),
        name: z.string().optional(),
        overview: z.string().optional(),
        still_path: z.string().nullish(),
      }),
    )
    .default([]),
});

const CERTIFICATES = 'credits,release_dates,content_ratings';

const CERTIFICATES_AND_VIDEOS = `${CERTIFICATES},videos`;

const DetailResponseSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  name: z.string().optional(),
  tagline: z.string().optional(),
  overview: z.string().optional(),
  release_date: z.string().optional(),
  first_air_date: z.string().optional(),
  poster_path: z.string().nullish(),
  backdrop_path: z.string().nullish(),
  vote_average: z.number().optional(),
  genres: z.array(z.object({ name: z.string() })).default([]),
  seasons: z
    .array(
      z.object({
        season_number: z.number().int(),
        episode_count: z.number().int().nonnegative(),
      }),
    )
    .default([]),
  release_dates: z
    .object({
      results: z
        .array(
          z.object({
            iso_3166_1: z.string(),
            release_dates: z.array(z.object({ certification: z.string().optional() })).default([]),
          }),
        )
        .default([]),
    })
    .optional(),
  content_ratings: z
    .object({
      results: z
        .array(z.object({ iso_3166_1: z.string(), rating: z.string().optional() }))
        .default([]),
    })
    .optional(),
  credits: z
    .object({
      cast: z
        .array(
          z.object({
            id: z.number().int().positive().nullish(),
            name: z.string(),
            character: z.string().optional(),
            profile_path: z.string().nullish(),
          }),
        )
        .default([]),
    })
    .optional(),
  videos: z
    .object({
      results: z
        .array(
          z.object({
            key: z.string(),
            site: z.string(),
            type: z.string(),
            official: z.boolean().optional(),
          }),
        )
        .default([]),
    })
    .optional(),
});

const TitleResponseSchema = DetailResponseSchema.extend({
  runtime: z.number().int().nullish(),
  episode_run_time: z.array(z.number().int()).default([]),
});

type Fetcher = (
  url: string,
  headers?: Record<string, string>,
) => Promise<{ ok: boolean; status: number; json: () => Promise<JsonValue> }>;

type CreateCatalogueMetadataProviderOptions = {
  readApiKey: () => Promise<string | null>;
  readWantsTrailers?: () => Promise<boolean>;
  baseUrl?: string;
  imageBaseUrl?: string;
  fetchImpl?: Fetcher;
  onProblem?: (reason: string) => void;
};

/**
 * Reads the year out of a catalogue's release date, which is absent for anything unreleased and an
 * empty string for plenty of entries that are.
 *
 * @param date - The date as the catalogue gave it.
 * @returns The year, or null where there was none to read.
 */
const readYear = (date: string | undefined): number | null => {
  const year = Number(date?.slice(0, 4));

  return Number.isInteger(year) && year > 1870 ? year : null;
};

/**
 * Strips a title to the letters and digits in it, in any script, so that punctuation, spacing and
 * case cannot make two spellings of the same title look different.
 *
 * @param value - The title as written.
 * @returns The title as letters and digits alone.
 */
const normalizeTitle = (value: string): string =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

const DENSE_SCRIPT = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;

const LEAST_MEANINGFUL = 4;
const LEAST_MEANINGFUL_DENSE = 2;

const SEGMENTER = new Intl.Segmenter(undefined, { granularity: 'word' });

/**
 * Picks the words of a title worth comparing, dropping the articles and prepositions that almost
 * every title contains — two films sharing only the word "the" share nothing.
 *
 * @param value - The title as written.
 * @returns The words worth matching on.
 */
const significantWords = (value: string): Set<string> => {
  const words = new Set<string>();

  for (const { segment, isWordLike } of SEGMENTER.segment(normalizeTitle(value))) {
    const least = DENSE_SCRIPT.test(segment) ? LEAST_MEANINGFUL_DENSE : LEAST_MEANINGFUL;

    if (isWordLike === true && segment.length >= least) {
      words.add(segment);
    }
  }

  return words;
};

/**
 * Decides whether two titles share a word that means anything, which is the guard against a high
 * similarity score between short titles that merely look alike.
 *
 * @param left - One title.
 * @param right - The title to compare it against.
 * @returns Whether they share a word worth sharing.
 */
const shareASignificantWord = (left: string, right: string): boolean => {
  const leftWords = significantWords(left);
  const rightWords = significantWords(right);

  if (leftWords.size === 0 || rightWords.size === 0) {
    return true;
  }

  return [...rightWords].some((word) => leftWords.has(word));
};

/**
 * Scores how alike two titles are, from nothing to one, on the letters they have in common once
 * both have been stripped. Used to choose between what a catalogue answered a search with, where the
 * filename is the only thing to judge by.
 *
 * @param left - One title.
 * @param right - The title to compare it against.
 * @returns How alike they are.
 */
const similarity = (left: string, right: string): number => {
  const pairsOf = (value: string): string[] => {
    const clean = normalizeTitle(value).replace(/ /g, '');

    return [...clean].slice(0, -1).map((letter, at) => `${letter}${clean[at + 1] ?? ''}`);
  };

  const leftPairs = pairsOf(left);
  const rightPairs = pairsOf(right);

  if (leftPairs.length === 0 || rightPairs.length === 0) {
    const cleanLeft = normalizeTitle(left);

    return cleanLeft !== '' && cleanLeft === normalizeTitle(right) ? 1 : 0;
  }

  const remaining = [...rightPairs];

  const shared = leftPairs.filter((pair) => {
    const at = remaining.indexOf(pair);

    if (at === -1) {
      return false;
    }

    remaining.splice(at, 1);

    return true;
  }).length;

  return (2 * shared) / (leftPairs.length + rightPairs.length);
};

const YEAR_BONUS = 0.15;

const TIE = 0.001;

const SECONDS_IN_MINUTE = 60;

type Shortlist = {
  entries: SearchResult[];
  wasExact: boolean;
};

/**
 * Every entry a catalogue offered that is equally the likeliest answer, scoring each on its title
 * and its year. A wrong match is worse than no match: it fills a library with confident nonsense,
 * where no match leaves the filename showing.
 *
 * All of the joint best rather than one of them, because a title and a year do not always name one
 * film. Two films called Good Boy came out in 2026, so both score exactly alike, and picking one of
 * them is picking whichever the catalogue happened to list first — which is how two different files
 * ended up sharing an identity. Handing back the tie lets something that can actually tell them
 * apart settle it.
 *
 * @param candidates - What the catalogue offered.
 * @param wanted - The title read from the file.
 * @param year - The year read from the file, where it had one.
 * @returns The joint best entries, and whether they matched the title exactly.
 */
const bestMatches = (
  candidates: readonly SearchResult[],
  wanted: string,
  year: number | null,
): Shortlist => {
  const normalised = normalizeTitle(wanted);

  const exact =
    normalised === ''
      ? []
      : candidates.filter(
          (entry) => normalizeTitle(entry.title ?? entry.name ?? '') === normalised,
        );

  if (exact.length > 0) {
    return { entries: exact, wasExact: true };
  }

  const scored = candidates
    .map((entry) => {
      const found = readYear(entry.release_date ?? entry.first_air_date);

      const names = [entry.title, entry.name, entry.original_title, entry.original_name].filter(
        (name) => name !== undefined,
      );

      return {
        entry,
        score:
          Math.max(0, ...names.map((name) => similarity(wanted, name))) +
          (year !== null && found === year ? YEAR_BONUS : 0),
      };
    })
    .sort((left, right) => right.score - left.score);

  const best = scored[0];

  if (best === undefined) {
    return { entries: candidates[0] === undefined ? [] : [candidates[0]], wasExact: false };
  }

  return {
    entries: scored.filter((one) => best.score - one.score <= TIE).map((one) => one.entry),
    wasExact: false,
  };
};

/**
 * Settles a tie by how long the film runs.
 *
 * Two films sharing a title and a year are told apart by almost anything else, and the length is
 * the one thing already known about the file without asking anybody. A seventy-three minute file is
 * not the hundred and ten minute film of the same name, however alike their titles read.
 *
 * Left unsettled where nothing offered a runtime, since guessing here is what the tie was about.
 *
 * @param candidates - The tied entries, each with the runtime the catalogue gives it.
 * @param minutes - How long the file actually runs.
 * @returns The closest entry, or nothing where no runtime was known.
 */
const closestToRuntime = (
  candidates: readonly { entry: SearchResult; runtimeMinutes: number | null }[],
  minutes: number,
): SearchResult | undefined => {
  const known = candidates.filter(
    (one): one is { entry: SearchResult; runtimeMinutes: number } =>
      one.runtimeMinutes !== null && one.runtimeMinutes > 0,
  );

  const [closest] = known.sort(
    (left, right) =>
      Math.abs(left.runtimeMinutes - minutes) - Math.abs(right.runtimeMinutes - minutes),
  );

  return closest?.entry;
};

/**
 * Builds the address of a catalogue image at a width worth fetching — the catalogue offers sizes up
 * to originals measured in megabytes, and a poster in a grid is a few hundred pixels wide.
 *
 * @param base - Where the catalogue serves its images from.
 * @param path - The image path the catalogue gave.
 * @param size - Which of the catalogue's sizes to ask for.
 * @returns The full address, or null where the catalogue gave no image.
 */
const imageUrl = (base: string, path: string | null | undefined, size: string): string | null =>
  path === null || path === undefined || path === '' ? null : `${base}/${size}${path}`;

/**
 * A title the catalogue listed, as offered to choose from: its catalogue id, title, year, synopsis
 * and poster.
 *
 * @param entry - What the catalogue listed.
 * @param kind - Whether it is a film or a series.
 * @param fallback - The title to give it where the catalogue names nothing.
 * @param base - Where the catalogue keeps its images.
 * @returns It as a match.
 */
const matchOf = (
  entry: SearchResult,
  kind: 'tv' | 'movie',
  fallback: string,
  base: string,
): CatalogueMatch => ({
  externalId: entry.id.toString(),
  kind,
  title: entry.title ?? entry.name ?? fallback,
  year: readYear(entry.release_date ?? entry.first_air_date),
  overview: entry.overview === undefined || entry.overview === '' ? null : entry.overview,
  posterUrl: imageUrl(base, entry.poster_path, 'w342'),
});

/**
 * Reads metadata from an online catalogue — descriptions, cast, artwork, ratings — for files whose
 * names alone say little. Everything it answers with is chosen against what the filename said, and a
 * catalogue that is unreachable, throttled or simply ignorant of a file leaves the filename reader's
 * answer standing rather than failing the scan.
 *
 * @param options - The credential to use, which catalogue to ask, and how to report a problem.
 * @returns The provider, ready to be asked about files.
 */
/**
 * Picks the trailer to remember out of everything a catalogue has filmed about a title: teasers,
 * clips, featurettes and half a dozen trailers in as many languages.
 *
 * Only YouTube, because that is the only thing Valence can play one from, and an official one ahead
 * of a fan cut. Nothing is what a title with no trailer gets, which is most of them.
 *
 * @param detail - The catalogue's own record, with its videos appended.
 * @returns The YouTube identifier of the trailer, or null.
 */
const youTubeTrailerIn = (detail: z.infer<typeof DetailResponseSchema>): string | null => {
  const filmed = (detail.videos?.results ?? []).filter(
    (video) => video.site === 'YouTube' && video.type === 'Trailer',
  );

  return (filmed.find((video) => video.official === true) ?? filmed[0])?.key ?? null;
};

const createCatalogueMetadataProvider = ({
  readApiKey,
  readWantsTrailers = () => Promise.resolve(false),
  baseUrl = DEFAULT_BASE_URL,
  imageBaseUrl = DEFAULT_IMAGE_BASE_URL,
  fetchImpl,
  onProblem,
}: CreateCatalogueMetadataProviderOptions): MetadataProvider => {
  const gate = createCatalogueGate(AT_ONCE);
  const said = createExpiringCache<Promise<JsonValue | null>>(CATALOGUE_ANSWER_LIVES_FOR_MS, {
    holds: REMEMBERED,
  });

  const call: Fetcher =
    fetchImpl ??
    (async (url: string, headers?: Record<string, string>) => {
      const response = await fetch(url, headers === undefined ? {} : { headers });

      return {
        ok: response.ok,
        status: response.status,
        json: async (): Promise<JsonValue> => JsonValueSchema.parse(await response.json()),
      };
    });

  const ask = async (path: string, key: string, query: Record<string, string>) => {
    const isToken = isAccessToken(key);
    const parameters = new URLSearchParams(isToken ? query : { api_key: key, ...query });

    for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
      const response = await gate.run(() =>
        call(
          `${baseUrl}${path}?${parameters.toString()}`,
          isToken ? { authorization: `Bearer ${key}` } : undefined,
        ),
      );

      if (response.ok) {
        return response.json();
      }

      if (!isWorthRetrying(response.status) || attempt === RETRIES) {
        onProblem?.(`The catalogue answered ${response.status.toString()} for ${path}.`);

        return null;
      }

      const backoff = BACKOFF_MILLISECONDS * 2 ** attempt;

      if (response.status === TOO_MANY) {
        gate.holdFor(backoff);
      }

      await wait(backoff);
    }

    return null;
  };

  /**
   * Asks the catalogue for something, or hands back what it already said.
   *
   * A library is full of files that want the same answer — every episode of a programme asks after
   * the same series, and every episode of a season after the same season. Asked once each, a
   * programme of ninety episodes costs a handful of requests rather than nearly three hundred.
   *
   * What is remembered is the promise rather than the answer, so files being read at the same time
   * share one request in flight instead of each starting their own.
   *
   * An answer is kept for six hours rather than for as long as the process runs. It used to be the
   * latter, which made a catalogue the server had once read unchangeable until it was restarted: a
   * season that aired afterwards never appeared, and neither did a correction made upstream. A
   * failure was kept the same way, so one unreachable moment was permanent. Six hours is long
   * enough that one scan of a large library asks each question once, which is the burst this is
   * for and which can run for hours, and short enough that a season airing today is on the show's
   * page today. See VAL-221.
   *
   * @param path - The catalogue path being asked for.
   * @param key - The credential to ask with.
   * @param query - What to ask for.
   * @returns What the catalogue said, or null where it would not say.
   */
  const request = async (path: string, key: string, query: Record<string, string>) => {
    const at = `${path}?${new URLSearchParams(query).toString()}`;
    const remembered = said.get(at);

    if (remembered !== undefined) {
      return remembered;
    }

    const asking = ask(path, key, query);

    said.set(at, asking);

    return asking;
  };

  return {
    name: 'catalogue',

    forgetAnswers: () => {
      said.clear();
    },

    describe: async (facts) => {
      const key = await readApiKey();

      if (key === null || key === '') {
        return null;
      }

      const wantsTrailers = await readWantsTrailers();
      const appended = wantsTrailers ? CERTIFICATES_AND_VIDEOS : CERTIFICATES;

      const episodeNumber = facts.episode?.episodeNumber ?? null;
      const isEpisode = episodeNumber !== null;
      const fromFilename = readTitleFromPath(facts.path);
      const searchTitle = isEpisode
        ? (facts.episode?.seriesTitle ?? fromFilename.title)
        : fromFilename.title;

      /**
       * Turns a catalogue entry into the metadata Valence stores, taking only the fields it has a use for
       * and building full addresses for the artwork.
       *
       * @param detail - The catalogue's own record.
       * @param isTheRightSeries - Whether it is a film or a programme, which decides where the title lives.
       * @returns The metadata to store against the file.
       */
      const describeFrom = async (
        detail: z.infer<typeof DetailResponseSchema>,
        isTheRightSeries = false,
      ): Promise<Metadata | null> => {
        const cast: CastMember[] =
          detail.credits?.cast.slice(0, CAST_STORED).map((member) => ({
            personId: member.id ?? null,
            name: member.name,
            role: member.character ?? '',
            imageUrl: imageUrl(imageBaseUrl, member.profile_path, 'w185'),
          })) ?? [];

        const poster = imageUrl(imageBaseUrl, detail.poster_path, 'w500');

        const season = isEpisode
          ? SeasonResponseSchema.safeParse(
              await request(
                `/tv/${detail.id.toString()}/season/${(facts.episode?.seasonNumber ?? 1).toString()}`,
                key,
                {},
              ),
            )
          : null;

        const episode =
          season?.success === true
            ? (season.data.episodes.find((one) => one.episode_number === episodeNumber) ?? null)
            : null;

        const knownEpisodeTitle = facts.episode?.episodeTitle ?? null;
        const catalogueEpisodeName =
          episode !== null && episode.name !== undefined && episode.name !== ''
            ? episode.name
            : null;

        if (
          isEpisode &&
          !isTheRightSeries &&
          knownEpisodeTitle !== null &&
          catalogueEpisodeName !== null &&
          !shareASignificantWord(knownEpisodeTitle, catalogueEpisodeName)
        ) {
          return null;
        }

        const still = episode === null ? null : imageUrl(imageBaseUrl, episode.still_path, 'w780');
        const backdrop = still ?? imageUrl(imageBaseUrl, detail.backdrop_path, 'w1280');

        const certificates = readCertifications(detail);
        const trailerKey = wantsTrailers ? youTubeTrailerIn(detail) : null;

        const seriesName = detail.title ?? detail.name ?? searchTitle;
        const episodeName = catalogueEpisodeName ?? knownEpisodeTitle;

        const overview =
          episode !== null && episode.overview !== undefined && episode.overview !== ''
            ? episode.overview
            : detail.overview;

        return {
          title: isEpisode ? (episodeName ?? seriesName) : seriesName,
          ...(isEpisode ? { seriesTitle: seriesName } : {}),
          year: readYear(detail.release_date ?? detail.first_air_date),
          externalId: detail.id.toString(),
          ...(overview === undefined || overview === '' ? {} : { overview }),
          ...(detail.tagline === undefined || detail.tagline === ''
            ? {}
            : { tagline: detail.tagline }),
          ...(detail.genres.length === 0
            ? {}
            : { genres: detail.genres.map((genre) => genre.name) }),
          ...(cast.length === 0 ? {} : { cast }),
          ...(detail.vote_average === undefined ? {} : { rating: detail.vote_average }),
          ...(Object.keys(certificates).length === 0 ? {} : { certifications: certificates }),
          ...(poster === null ? {} : { posterUrl: poster }),
          ...(backdrop === null ? {} : { backdropUrl: backdrop }),
          ...(trailerKey === null ? {} : { trailerKey }),
        };
      };

      if (
        facts.knownExternalId !== undefined &&
        facts.knownExternalId !== null &&
        facts.knownExternalId !== ''
      ) {
        const detailed = await request(
          `/${facts.knownExternalKind ?? (isEpisode ? 'tv' : 'movie')}/${facts.knownExternalId}`,
          key,
          { append_to_response: appended },
        );

        const detail = DetailResponseSchema.safeParse(detailed);

        if (detail.success) {
          return describeFrom(detail.data, true);
        }
      }

      const seriesYear = facts.episode?.seriesYear ?? null;
      const searched = await request(isEpisode ? '/search/tv' : '/search/movie', key, {
        query: searchTitle,
        ...(isEpisode
          ? seriesYear === null
            ? {}
            : { first_air_date_year: seriesYear.toString() }
          : fromFilename.year === null
            ? {}
            : { year: fromFilename.year.toString() }),
      });

      if (searched === null) {
        return null;
      }

      const results = SearchResponseSchema.safeParse(searched);
      const candidates = results.success ? results.data.results : [];

      const shortlist = bestMatches(
        candidates,
        searchTitle,
        seriesYear ?? fromFilename.year ?? null,
      );

      /**
       * Asks the catalogue how long each tied entry runs, so the file's own length can settle which
       * of them it is.
       *
       * Asked with the same extras the chosen entry is read with, so the one that wins is already
       * remembered by the time it is read in full.
       *
       * @param entries - The entries that tied.
       * @returns The one whose runtime is closest, or nothing where none gave one.
       */
      const settleByRuntime = async (
        entries: readonly SearchResult[],
      ): Promise<SearchResult | undefined> => {
        const timed = await Promise.all(
          entries.map(async (entry) => {
            const asked = await request(`/movie/${entry.id.toString()}`, key, {
              append_to_response: appended,
            });
            const parsed = TitleResponseSchema.safeParse(asked);

            return {
              entry,
              runtimeMinutes: parsed.success ? (parsed.data.runtime ?? null) : null,
            };
          }),
        );

        return closestToRuntime(timed, facts.probe.durationSeconds / SECONDS_IN_MINUTE);
      };

      const first =
        shortlist.entries.length > 1 && !isEpisode
          ? ((await settleByRuntime(shortlist.entries)) ?? shortlist.entries[0])
          : shortlist.entries[0];

      if (first === undefined) {
        return null;
      }

      const detailed = await request(
        `${isEpisode ? '/tv' : '/movie'}/${first.id.toString()}`,
        key,
        { append_to_response: appended },
      );

      const detail = DetailResponseSchema.safeParse(detailed);

      if (!detail.success) {
        return {
          title: first.title ?? first.name ?? searchTitle,
          year: readYear(first.release_date ?? first.first_air_date),
          externalId: first.id.toString(),
        };
      }

      return describeFrom(detail.data, shortlist.wasExact);
    },

    readPerson: async (personId) => {
      const key = await readApiKey();

      if (key === null || key === '') {
        return null;
      }

      const found = PersonResponseSchema.safeParse(
        await request(`/person/${personId.toString()}`, key, {}),
      );

      if (!found.success) {
        return null;
      }

      const said = found.data;

      return {
        id: said.id,
        name: said.name,
        portraitUrl: imageUrl(imageBaseUrl, said.profile_path, 'w300'),
        biography: said.biography === undefined || said.biography === '' ? null : said.biography,
        bornOn: said.birthday ?? null,
        bornIn: said.place_of_birth ?? null,
      };
    },

    readLogoUrl: async ({ externalId, isSeries }) => {
      const key = await readApiKey();

      if (key === null || key === '') {
        return null;
      }

      const path = `/${isSeries ? 'tv' : 'movie'}/${externalId}/images`;

      /**
       * Asks the catalogue for logos twice: first in the language the library prefers, then without a
       * language at all. One request cannot express "this language, or failing that anything", and asking
       * wide first means taking whichever logo the catalogue happens to list first.
       *
       * @param query - Which languages to ask for, in the catalogue's own terms.
       * @returns Every logo found, the preferred language first.
       */
      const readLogos = async (query: Record<string, string>) => {
        const images = ImagesResponseSchema.safeParse(await request(path, key, query));

        return images.success ? images.data.logos : [];
      };

      const found = await readLogos({ include_image_language: 'en,null' });
      const logos = found.length > 0 ? found : await readLogos({});

      const chosen = pickLogo(
        logos.map((logo) => ({
          filePath: logo.file_path,
          language: logo.iso_639_1 ?? null,
          width: logo.width,
          voteAverage: logo.vote_average,
          voteCount: logo.vote_count,
        })),
      );

      return chosen === null ? null : imageUrl(imageBaseUrl, chosen.filePath, 'original');
    },

    search: async (query, kind) => {
      const key = await readApiKey();

      if (key === null || key === '') {
        return [];
      }

      const searched = await request(`/search/${kind}`, key, { query });
      const results = SearchResponseSchema.safeParse(searched);

      if (!results.success) {
        return [];
      }

      return results.data.results.map((entry) => matchOf(entry, kind, query, imageBaseUrl));
    },

    browse: async ({ list, kind, page, studio }) => {
      const key = await readApiKey();

      if (key === null || key === '') {
        return { matches: [], hasMore: false };
      }

      const asked =
        studio === null
          ? { path: LIST_PATHS[list][kind], query: {} }
          : {
              path: `/discover/${kind}`,
              query: { with_companies: studio, sort_by: 'popularity.desc' },
            };

      const results = SearchResponseSchema.safeParse(
        await request(asked.path, key, { ...asked.query, page: page.toString() }),
      );

      if (!results.success) {
        return { matches: [], hasMore: false };
      }

      return {
        matches: results.data.results.map((entry) => matchOf(entry, kind, '', imageBaseUrl)),
        hasMore: page < results.data.total_pages,
      };
    },

    studios: async () => {
      const key = await readApiKey();

      if (key === null || key === '') {
        return [];
      }

      const answers = await Promise.all(
        STUDIO_IDS.map(async (id) => {
          const company = CompanyResponseSchema.safeParse(
            await request(`/company/${id.toString()}`, key, {}),
          );

          return company.success
            ? {
                id: company.data.id.toString(),
                name: company.data.name,
                logoUrl: imageUrl(imageBaseUrl, company.data.logo_path, 'w300'),
              }
            : null;
        }),
      );

      return answers
        .filter((studio) => studio !== null)
        .filter((studio) => studio.logoUrl !== null);
    },

    describeTitle: async (externalId, kind) => {
      const key = await readApiKey();

      if (key === null || key === '') {
        return null;
      }

      const detail = TitleResponseSchema.safeParse(
        await request(`/${kind}/${externalId}`, key, { append_to_response: 'credits' }),
      );

      if (!detail.success) {
        return null;
      }

      const found = detail.data;
      const runtime = found.runtime ?? found.episode_run_time[0] ?? 0;

      return {
        title: found.title ?? found.name ?? '',
        year: readYear(found.release_date ?? found.first_air_date),
        overview: found.overview === undefined || found.overview === '' ? null : found.overview,
        posterUrl: imageUrl(imageBaseUrl, found.poster_path, 'w342'),
        backdropUrl: imageUrl(imageBaseUrl, found.backdrop_path, 'w1280'),
        genres: found.genres.map((genre) => genre.name),
        runtimeMinutes: runtime > 0 ? runtime : null,
        cast: (found.credits?.cast ?? []).slice(0, CAST_DESCRIBED).map((member) => ({
          name: member.name,
          role: member.character === undefined || member.character === '' ? null : member.character,
          photoUrl: imageUrl(imageBaseUrl, member.profile_path, 'w185'),
        })),
      };
    },

    describeForRequest: async (externalId, kind) => {
      const key = await readApiKey();

      if (key === null || key === '') {
        return null;
      }

      const detail = await request(`/${kind}/${externalId}`, key, {
        append_to_response:
          kind === 'movie' ? 'release_dates,alternative_titles' : 'alternative_titles',
      });
      const listed =
        kind === 'movie'
          ? { seasons: [] }
          : (DetailResponseSchema.pick({ seasons: true }).safeParse(detail).data ?? {
              seasons: [],
            });
      const seasons = await Promise.all(
        listed.seasons.map((season) =>
          request(`/tv/${externalId}/season/${season.season_number.toString()}`, key, {}),
        ),
      );

      return readRequestCatalogue(detail, seasons, (path) => imageUrl(imageBaseUrl, path, 'w342'));
    },

    describeSeries: async (externalId) => {
      const key = await readApiKey();

      if (key === null || key === '') {
        return null;
      }

      const detailed = await request(`/tv/${externalId}`, key, {});
      const detail = DetailResponseSchema.safeParse(detailed);

      if (!detail.success) {
        return null;
      }

      const seasons = await Promise.all(
        detail.data.seasons.map(async (season) => {
          const listed = SeasonResponseSchema.safeParse(
            await request(`/tv/${externalId}/season/${season.season_number.toString()}`, key, {}),
          );

          return {
            seasonNumber: season.season_number,
            episodeCount: season.episode_count,
            episodes: !listed.success
              ? []
              : listed.data.episodes.map((episode) => ({
                  episodeNumber: episode.episode_number,
                  title:
                    episode.name === undefined || episode.name === ''
                      ? `Episode ${episode.episode_number.toString()}`
                      : episode.name,
                  stillUrl: imageUrl(imageBaseUrl, episode.still_path, 'w780'),
                  overview:
                    episode.overview === undefined || episode.overview === ''
                      ? null
                      : episode.overview,
                })),
          };
        }),
      );

      return { seasons };
    },
  };
};

export type { Fetcher };

export {
  createCatalogueMetadataProvider,
  readYear,
  imageUrl,
  normalizeTitle,
  significantWords,
  shareASignificantWord,
  similarity,
  isAccessToken,
};
