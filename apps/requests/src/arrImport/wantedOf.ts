import { dirname } from 'node:path';
import { MusicBrainzIdSchema } from '@ValenceContracts/schemas/MediaRequest';
import type { ArrRequester, ArrWanted } from '@ValenceContracts/schemas/ArrImport';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';
import type { ArrImportRead, ArrSetup, SeerrSetup } from '@ValenceRequests/arrImport/ArrSetup';
import { SEERR_SETTLED_MEDIA } from '@ValenceRequests/arrImport/SEERR_SETTLED_MEDIA';
import type {
  SeerrRequest,
  SeerrUser,
} from '@ValenceRequests/arrImport/schemas/SeerrRequestPageSchema';

type WantedPlacing = {
  libraryOf: (path: string | null, kind: LibraryKind) => string | null;
  profileOf: (setup: ArrSetup, arrProfileId: number | null | undefined) => string | null;
};

const PENDING = 1;

const APPROVED = 2;

/**
 * The folder something an app holds sits in, to find its library by.
 *
 * @param item - Where the app keeps it.
 * @returns The folder, or none.
 */
const folderOf = (item: {
  rootFolderPath?: string | null | undefined;
  path?: string | null | undefined;
}): string | null =>
  item.rootFolderPath ??
  (item.path === null || item.path === undefined ? null : dirname(item.path));

/**
 * Who asked for a request in Overseerr or Jellyseerr, as Valence finds them again: their name, the
 * address they signed in with, and the Plex or Jellyfin account behind them.
 *
 * @param user - Who asked, as it keeps them.
 * @returns Who asked.
 */
const requesterOf = (user: SeerrUser): ArrRequester => ({
  name:
    user.displayName ??
    user.username ??
    user.plexUsername ??
    user.jellyfinUsername ??
    user.email ??
    user.id.toString(),
  email: user.email === null || user.email === undefined || user.email === '' ? null : user.email,
  plexId: user.plexId ?? null,
  jellyfinUserId: user.jellyfinUserId ?? null,
});

/**
 * Two asks for the same title as one: every season either asked for, approved where either was,
 * and whoever asked, the library and the profile where only one says.
 *
 * @param kept - The ask already held.
 * @param more - Another for the same title.
 * @returns Both as one.
 */
const together = (kept: ArrWanted, more: ArrWanted): ArrWanted => ({
  ...kept,
  seasons:
    kept.seasons === null || more.seasons === null
      ? null
      : [...new Set([...kept.seasons, ...more.seasons])].toSorted((left, right) => left - right),
  isApproved: kept.isApproved || more.isApproved,
  requester: kept.requester ?? more.requester,
  libraryId: kept.libraryId ?? more.libraryId,
  profileId: kept.profileId ?? more.profileId,
  tvdbId: kept.tvdbId ?? more.tvdbId,
});

/**
 * Where an Overseerr or Jellyseerr request was to be filed: the root folder it chose, or else the
 * folder of the Radarr or Sonarr it was sent to, or its default one.
 *
 * @param seerr - The app it was made in.
 * @param request - The request.
 * @param kind - Whether it is for a film or a series.
 * @returns The folder, or none.
 */
const seerrFolderOf = (seerr: SeerrSetup, request: SeerrRequest, kind: 'radarr' | 'sonarr') => {
  if (
    request.rootFolder !== null &&
    request.rootFolder !== undefined &&
    request.rootFolder !== ''
  ) {
    return request.rootFolder;
  }

  const servers = seerr.servers.filter((server) => server.kind === kind);
  const server =
    servers.find((one) => one.id === request.serverId && one.is4k === request.is4k) ??
    servers.find((one) => one.isDefault && one.is4k === request.is4k) ??
    servers.find((one) => one.isDefault);

  return server?.activeDirectory ?? null;
};

/**
 * Everything that was being waited for, as requests for Valence to make: each film, series and
 * artist an app monitors that it has no file for yet — a series only for the monitored seasons
 * still missing episodes — and each Overseerr or Jellyseerr request still pending, approved or
 * being fetched, with who asked; one ask for each title however many places wanted it, and a count
 * of what cannot be asked for because the app knows it by no id Valence asks by.
 *
 * @param read - What was read.
 * @param placing - How to find the library and profile each goes to.
 * @returns What to ask for, and how much could not be.
 */
const wantedOf = (
  read: Pick<ArrImportRead, 'arrs' | 'seerrs'>,
  placing: WantedPlacing,
): { wanted: ArrWanted[]; unaskable: number } => {
  const held = new Map<string, ArrWanted>();
  let unaskable = 0;

  const add = (one: ArrWanted) => {
    const kept = held.get(one.key);

    held.set(one.key, kept === undefined ? one : together(kept, one));
  };

  for (const setup of read.arrs) {
    for (const movie of setup.movies.filter((one) => one.monitored && !one.hasFile)) {
      if (movie.tmdbId <= 0) {
        unaskable += 1;
        continue;
      }

      add({
        key: `film:${movie.tmdbId.toString()}`,
        kind: 'film',
        tmdbId: movie.tmdbId,
        tvdbId: null,
        musicBrainzId: null,
        title: movie.title,
        seasons: null,
        libraryId: placing.libraryOf(folderOf(movie), 'movies'),
        profileId: placing.profileOf(setup, movie.qualityProfileId),
        isApproved: true,
        requester: null,
      });
    }

    for (const series of setup.series.filter((one) => one.monitored)) {
      const seasons = series.seasons
        .filter(
          (season) =>
            season.monitored &&
            (season.statistics === null ||
              season.statistics === undefined ||
              season.statistics.episodeFileCount < season.statistics.episodeCount),
        )
        .map((season) => season.seasonNumber);

      if (seasons.length === 0) {
        continue;
      }

      if (series.tmdbId <= 0 && series.tvdbId <= 0) {
        unaskable += 1;
        continue;
      }

      add({
        key:
          series.tmdbId > 0
            ? `series:${series.tmdbId.toString()}`
            : `series:tvdb:${series.tvdbId.toString()}`,
        kind: 'series',
        tmdbId: series.tmdbId > 0 ? series.tmdbId : null,
        tvdbId: series.tvdbId > 0 ? series.tvdbId : null,
        musicBrainzId: null,
        title: series.title,
        seasons,
        libraryId: placing.libraryOf(folderOf(series), 'shows'),
        profileId: placing.profileOf(setup, series.qualityProfileId),
        isApproved: true,
        requester: null,
      });
    }

    for (const artist of setup.artists.filter(
      (one) =>
        one.monitored &&
        (one.statistics === null ||
          one.statistics === undefined ||
          one.statistics.trackFileCount < one.statistics.trackCount),
    )) {
      const musicBrainzId = MusicBrainzIdSchema.safeParse(artist.foreignArtistId);

      if (!musicBrainzId.success) {
        unaskable += 1;
        continue;
      }

      add({
        key: `artist:${musicBrainzId.data}`,
        kind: 'artist',
        tmdbId: null,
        tvdbId: null,
        musicBrainzId: musicBrainzId.data,
        title: artist.artistName,
        seasons: null,
        libraryId: placing.libraryOf(folderOf(artist), 'music'),
        profileId: placing.profileOf(setup, artist.qualityProfileId),
        isApproved: true,
        requester: null,
      });
    }
  }

  for (const seerr of read.seerrs) {
    const settled =
      SEERR_SETTLED_MEDIA[seerr.source.kind === 'jellyseerr' ? 'jellyseerr' : 'overseerr'];

    for (const request of seerr.requests.filter(
      (one) =>
        (one.status === PENDING || one.status === APPROVED) &&
        !settled.includes(one.media.status ?? 0),
    )) {
      const isSeries = (request.type ?? request.media.mediaType) === 'tv';
      const tmdbId = request.media.tmdbId ?? 0;

      if (tmdbId <= 0) {
        unaskable += 1;
        continue;
      }

      const seasons = request.seasons
        .filter((season) => season.status === PENDING || season.status === APPROVED)
        .map((season) => season.seasonNumber);

      add({
        key: `${isSeries ? 'series' : 'film'}:${tmdbId.toString()}`,
        kind: isSeries ? 'series' : 'film',
        tmdbId,
        tvdbId: isSeries && (request.media.tvdbId ?? 0) > 0 ? (request.media.tvdbId ?? null) : null,
        musicBrainzId: null,
        title: '',
        seasons: isSeries && seasons.length > 0 ? seasons : null,
        libraryId: placing.libraryOf(
          seerrFolderOf(seerr, request, isSeries ? 'sonarr' : 'radarr'),
          isSeries ? 'shows' : 'movies',
        ),
        profileId: null,
        isApproved: request.status === APPROVED,
        requester:
          request.requestedBy === null || request.requestedBy === undefined
            ? null
            : requesterOf(request.requestedBy),
      });
    }
  }

  return { wanted: [...held.values()], unaskable };
};

export type { WantedPlacing };

export { wantedOf };
