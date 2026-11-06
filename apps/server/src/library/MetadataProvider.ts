import type { CataloguePerson } from '@ValenceContracts/schemas/CataloguePeople';
import type {
  ArtworkOption,
  ArtworkChoices,
  ArtworkKind,
} from '@ValenceContracts/schemas/ArtworkChoice';
import type { ContentAdvice } from '@ValenceContracts/schemas/Advisory';
import type { Said } from '@ValenceI18n/SaidSchema';
import type { MediaProbe } from '@ValenceServer/transcoder/TranscoderClient';
import type { ExternalIds } from '@ValenceServer/library/naming/ExternalIds.types';
import type { NextEpisode } from '@ValenceServer/library/nextEpisodeOf';
import type { Person } from '@ValenceContracts/schemas/Person';
import type { RequestCatalogue } from '@ValenceContracts/schemas/MediaRequest';
import type {
  CatalogueFilters,
  CatalogueGenre,
  CatalogueList,
  CatalogueStudio,
} from '@ValenceContracts/schemas/CatalogueTitle';
import { firstAnswerOf } from '@ValenceServer/library/firstAnswerOf';
import type { EpisodeGroup } from '@ValenceServer/requests/anime/EpisodeGroup';
import type { Likeness, TitleKind } from '@ValenceServer/likeness/Likeness';

type SeriesReach = { season: number; episode: number };

type BorrowedSeason = { seasonNumber: number; externalId: string; externalSeason: number };

type MediaFacts = {
  path: string;
  probe: MediaProbe;
  episode?: {
    seriesTitle: string | null;
    seriesYear?: number | null;
    seriesFolder?: string | null;
    seasonNumber: number | null;
    episodeNumber: number | null;
    episodeNumberEnd?: number | null;
    episodeTitle?: string | null;
    airDate?: string | null;
    seriesReach?: SeriesReach | null;
  };
  knownExternalId?: string | null;
  knownExternalKind?: 'tv' | 'movie';
  title?: string;
  year?: number | null;
  ids?: ExternalIds;
  rememberedExternalId?: string | null;
  language?: string;
  episodeOrder?: string;
  borrowed?: readonly BorrowedSeason[];
};

type CastMember = {
  personId: number | null;
  name: string;
  role: string;
  imageUrl: string | null;
};

type Metadata = {
  title: string;
  year: number | null;
  overview?: string;
  tagline?: string;
  genres?: string[];
  cast?: CastMember[];
  guestStars?: CastMember[];
  directors?: string[];
  writers?: string[];
  creators?: string[];
  countries?: string[];
  originalLanguage?: string;
  episodeTotal?: number;
  rating?: number;
  certifications?: Record<string, string>;
  contentAdvice?: ContentAdvice;
  seriesTitle?: string;
  posterUrl?: string;
  backdropUrl?: string;
  logoUrl?: string;
  externalId?: string;
  trailerKey?: string;
  releaseDate?: string;
  budget?: number;
  revenue?: number;
  status?: string;
  imdbId?: string;
  rottenTomatoes?: number;
  originalTitle?: string;
  studios?: string[];
  networks?: string[];
  tvdbId?: string;
  catalogueEpisodeId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
};

type CatalogueMatch = {
  externalId: string;
  kind: 'tv' | 'movie';
  title: string;
  year: number | null;
  overview: string | null;
  posterUrl: string | null;
};

type CatalogueBrowsing = {
  list: CatalogueList;
  kind: 'tv' | 'movie';
  page: number;
  studio: string | null;
  filters?: CatalogueFilters;
};

type CatalogueSearching = { query: string; kind: 'tv' | 'movie'; page: number };

type CatalogueCredit = CatalogueMatch & {
  role: string | null;
  episodeCount: number | null;
};

type CataloguePersonWork = {
  titles: CatalogueMatch[];
  timeline: CatalogueCredit[];
};

type CataloguePaged = { matches: CatalogueMatch[]; hasMore: boolean; total?: number };

type CatalogueDescription = {
  title: string;
  year: number | null;
  overview: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  genres: string[];
  runtimeMinutes: number | null;
  cast: { personId: number | null; name: string; role: string | null; photoUrl: string | null }[];
  trailerKey: string | null;
  rating?: number | null;
  certifications?: Record<string, string>;
  originalTitle?: string | null;
  tagline?: string | null;
  releaseDate?: string | null;
  status?: string | null;
  studios?: string[];
  networks?: string[];
  imdbId?: string | null;
  tvdbId?: string | null;
  originalLanguage?: string | null;
  countries?: string[];
  creators?: string[];
  directors?: string[];
  writers?: string[];
};

type SeriesShape = {
  seasons: {
    seasonNumber: number;
    episodeCount: number;
    name?: string | null;
    overview?: string | null;
    posterUrl?: string | null;
    airDate?: string | null;
    episodes: {
      episodeNumber: number;
      title: string;
      stillUrl: string | null;
      overview: string | null;
      airDate?: string | null;
    }[];
  }[];
  status?: string | null;
  overview?: string | null;
};

type AiringSeason = {
  seasonNumber: number;
  episodes: { episodeNumber: number; title: string; airDate: string; stillUrl: string | null }[];
};

type OwnPicture = { url: string; previewUrl: string };

type OwnArtwork = Record<ArtworkKind, OwnPicture | null>;

type MetadataProvider = {
  name: string;
  describe: (facts: MediaFacts) => Promise<Metadata | null>;
  describeSeries?: (
    externalId: string,
    order?: string,
    borrowed?: readonly BorrowedSeason[],
  ) => Promise<SeriesShape | null>;
  describeNextEpisode?: (externalId: string) => Promise<NextEpisode | null>;
  describeAiringSeason?: (externalId: string) => Promise<AiringSeason | null>;
  readLogoUrl?: (options: { externalId: string; isSeries: boolean }) => Promise<string | null>;
  readArtworkOptions?: (options: {
    externalId: string;
    isSeries: boolean;
    tvdbId?: string | null;
  }) => Promise<ArtworkChoices['options'] | null>;
  readPartArtwork?: (options: {
    externalId: string;
    season: number;
    episode: number | null;
  }) => Promise<ArtworkOption[] | null>;
  readOwnArtwork?: (options: {
    externalId: string;
    isSeries: boolean;
  }) => Promise<OwnArtwork | null>;
  readPerson?: (personId: number) => Promise<Person | null>;
  readLikeness?: (externalId: string, kind: TitleKind) => Promise<Likeness | null>;
  search?: (query: string, kind: 'tv' | 'movie') => Promise<CatalogueMatch[]>;
  searchPages?: (searching: CatalogueSearching) => Promise<CataloguePaged>;
  browse?: (browsing: CatalogueBrowsing) => Promise<CataloguePaged>;
  readPersonWork?: (personId: number) => Promise<CataloguePersonWork>;
  readSimilarTitles?: (externalId: string, kind: 'tv' | 'movie') => Promise<CatalogueMatch[]>;
  studios?: () => Promise<CatalogueStudio[]>;
  genres?: (kind: 'tv' | 'movie') => Promise<CatalogueGenre[]>;
  describeTitle?: (
    externalId: string,
    kind: 'tv' | 'movie',
  ) => Promise<CatalogueDescription | null>;
  describeForRequest?: (
    externalId: string,
    kind: 'tv' | 'movie',
  ) => Promise<RequestCatalogue | null>;
  seriesOfTvdbId?: (tvdbId: number) => Promise<number | null>;
  findByImdbId?: (imdbId: string, kind: 'tv' | 'movie') => Promise<string | null>;
  findByTvdbId?: (tvdbId: string, kind: 'tv' | 'movie') => Promise<string | null>;
  readEpisodeGroups?: (externalId: string) => Promise<EpisodeGroup[]>;
  searchPeople?: (name: string) => Promise<CataloguePerson[]>;
  forgetAnswers?: () => void;
  forgetAnswersAbout?: (externalId: string, kind: 'tv' | 'movie') => void;
};

/**
 * Asks each metadata provider in turn which episode of a series airs next, taking the first that
 * knows.
 *
 * @param providers - The providers to ask, in order of preference.
 * @param externalId - The catalogue's identifier for the programme.
 * @param onProblem - Told when a provider fails, so a request can carry on without it.
 * @returns The next episode to air, or null where nobody knows of one.
 */
const resolveNextEpisode = (
  providers: MetadataProvider[],
  externalId: string,
  onProblem?: (provider: string, reason: Said) => void,
): Promise<NextEpisode | null> =>
  firstAnswerOf(providers, (provider) => provider.describeNextEpisode?.(externalId), onProblem);

/**
 * Asks each metadata provider in turn for the dated episodes of the season a series is airing, or
 * has just finished, taking the first that knows.
 *
 * @param providers - The providers to ask, in order of preference.
 * @param externalId - The catalogue's identifier for the programme.
 * @param onProblem - Told when a provider fails, so a request can carry on without it.
 * @returns The season, or null where the series is not airing or nobody knows.
 */
const resolveAiringSeason = (
  providers: MetadataProvider[],
  externalId: string,
  onProblem?: (provider: string, reason: Said) => void,
): Promise<AiringSeason | null> =>
  firstAnswerOf(providers, (provider) => provider.describeAiringSeason?.(externalId), onProblem);

/**
 * Asks each metadata provider in turn what a series is meant to contain, taking the first real
 * answer. This is what makes a missing episode visible: without a catalogue's own list, a season
 * that stops at episode nine and a season missing its tenth look identical.
 *
 * @param providers - The providers to ask, in order of preference.
 * @param externalId - The catalogue's identifier for the programme.
 * @param onProblem - Told when a provider fails, so a scan can report it without stopping.
 * @param order - Another of the catalogue's orders the programme's files are numbered in, where one
 *   was chosen, so its seasons and episodes are laid out as the files are.
 * @param borrowed - Seasons somebody said are another catalogue entry's, laid out from that entry.
 * @returns The shape of the series, or null where nobody could say.
 */
const resolveSeriesShape = (
  providers: MetadataProvider[],
  externalId: string,
  onProblem?: (provider: string, reason: Said) => void,
  order?: string,
  borrowed: readonly BorrowedSeason[] = [],
): Promise<SeriesShape | null> =>
  firstAnswerOf(
    providers,
    (provider) => provider.describeSeries?.(externalId, order, borrowed),
    onProblem,
  );

/**
 * Asks each metadata provider in turn about one file and takes the first real answer, so a plugin's
 * provider overrides the built-in filename reader without replacing it. A provider that fails is
 * skipped rather than failing the scan — a metadata service being down must not make a library
 * unreadable.
 *
 * @param providers - The providers to ask, in order of preference.
 * @param facts - What is known about the file from its path.
 * @param onProblem - Told when a provider fails.
 * @returns The metadata found, or an empty answer where nobody recognised the file.
 */
const resolveMetadata = (
  providers: MetadataProvider[],
  facts: MediaFacts,
  onProblem?: (provider: string, reason: Said) => void,
): Promise<Metadata | null> =>
  firstAnswerOf(providers, (provider) => provider.describe(facts), onProblem);

export type {
  OwnArtwork,
  OwnPicture,
  AiringSeason,
  BorrowedSeason,
  CastMember,
  CatalogueBrowsing,
  CatalogueDescription,
  CatalogueList,
  CatalogueMatch,
  CatalogueCredit,
  CataloguePersonWork,
  CataloguePaged,
  CatalogueSearching,
  MediaFacts,
  Metadata,
  MetadataProvider,
  SeriesReach,
  SeriesShape,
};

export { resolveAiringSeason, resolveMetadata, resolveNextEpisode, resolveSeriesShape };
