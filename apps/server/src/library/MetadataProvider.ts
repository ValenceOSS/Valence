import type { ArtworkChoices, ArtworkKind } from '@ValenceContracts/schemas/ArtworkChoice';
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

type CataloguePaged = { matches: CatalogueMatch[]; hasMore: boolean };

type CatalogueDescription = {
  title: string;
  year: number | null;
  overview: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  genres: string[];
  runtimeMinutes: number | null;
  cast: { name: string; role: string | null; photoUrl: string | null }[];
  trailerKey: string | null;
};

type SeriesShape = {
  seasons: {
    seasonNumber: number;
    episodeCount: number;
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
  describeSeries?: (externalId: string) => Promise<SeriesShape | null>;
  describeNextEpisode?: (externalId: string) => Promise<NextEpisode | null>;
  describeAiringSeason?: (externalId: string) => Promise<AiringSeason | null>;
  readLogoUrl?: (options: { externalId: string; isSeries: boolean }) => Promise<string | null>;
  readArtworkOptions?: (options: {
    externalId: string;
    isSeries: boolean;
  }) => Promise<ArtworkChoices['options'] | null>;
  readOwnArtwork?: (options: {
    externalId: string;
    isSeries: boolean;
  }) => Promise<OwnArtwork | null>;
  readPerson?: (personId: number) => Promise<Person | null>;
  readLikeness?: (externalId: string, kind: TitleKind) => Promise<Likeness | null>;
  search?: (query: string, kind: 'tv' | 'movie') => Promise<CatalogueMatch[]>;
  browse?: (browsing: CatalogueBrowsing) => Promise<CataloguePaged>;
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
  readEpisodeGroups?: (externalId: string) => Promise<EpisodeGroup[]>;
  forgetAnswers?: () => void;
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
 * @returns The shape of the series, or null where nobody could say.
 */
const resolveSeriesShape = (
  providers: MetadataProvider[],
  externalId: string,
  onProblem?: (provider: string, reason: Said) => void,
): Promise<SeriesShape | null> =>
  firstAnswerOf(providers, (provider) => provider.describeSeries?.(externalId), onProblem);

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
  CastMember,
  CatalogueBrowsing,
  CatalogueDescription,
  CatalogueList,
  CatalogueMatch,
  CataloguePaged,
  MediaFacts,
  Metadata,
  MetadataProvider,
  SeriesReach,
  SeriesShape,
};

export { resolveAiringSeason, resolveMetadata, resolveNextEpisode, resolveSeriesShape };
