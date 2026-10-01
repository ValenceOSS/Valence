import { statfs } from 'node:fs/promises';
import { say } from '@ValenceI18n/say';
import { asTheServer } from '@ValenceServer/visibility/asTheServer';
import type { ArrAsked, ArrEmulation, ArrKind } from '@ValenceServer/arrEmulation/ArrEmulation';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { MediaRequestAsk } from '@ValenceContracts/schemas/MediaRequest';
import type { Permission } from '@ValenceContracts/schemas/Permission';

const SEERR_GRANTS: readonly Permission[] = ['requests.ask', 'requests.autoApprove'];

const LIBRARY_KIND_OF = { film: 'movies', series: 'shows' } as const;

/**
 * How much room the disk a library is on has, and how much it holds, where it can be read.
 *
 * @param path - The library's folder.
 * @returns The bytes free and in all, or none of either where the folder cannot be read.
 */
const roomOn = async (path: string): Promise<{ freeBytes: number; totalBytes: number }> => {
  const read = await statfs(path).catch(() => null);

  return read === null
    ? { freeBytes: 0, totalBytes: 0 }
    : { freeBytes: read.bavail * read.bsize, totalBytes: read.blocks * read.bsize };
};

/**
 * What Valence answers Overseerr and Jellyseerr with when it stands in for Radarr and Sonarr, made
 * from the server's own requests, libraries and catalogue. A film or series sent to it is asked for
 * as the account whoever manages requesting chose, approved, because Overseerr or Jellyseerr has
 * approved it already. It may ask and nothing more, so the quality profiles that account is held to
 * hold for whatever Overseerr or Jellyseerr sends.
 *
 * @param context - What the server's endpoints are answered with.
 * @param seriesOfTvdbId - Finds the catalogue's series for a TVDB id, which is all Sonarr is sent.
 * @returns The stand-in's dependencies.
 */
const arrEmulationOf = (
  context: AppContext,
  seriesOfTvdbId: (tvdbId: number) => Promise<number | null>,
): ArrEmulation => {
  const {
    settings,
    library,
    requestsClient,
    describeForRequest,
    discovery,
    listUsers,
    everyRequest,
    profileForAsk,
    draftFor,
    throughRequests,
    sayOfAsk,
    sayRequestsChanged,
  } = context;

  const ask = async (asked: Parameters<ArrEmulation['ask']>[0]): Promise<ArrAsked> => {
    const { seerr } = await settings.read();
    const account = ((await listUsers?.()) ?? []).find((one) => one.id === seerr.accountId);

    if (account === undefined) {
      return {
        kind: 'refused',
        status: 403,
        message: say('server.arrEmulation.chooseTheAccountSeerrAsksAs'),
      };
    }

    const asker = {
      account: () => Promise.resolve({ id: account.id, name: account.name }),
      holds: (permission: Permission) => Promise.resolve(SEERR_GRANTS.includes(permission)),
    };
    const wanted: MediaRequestAsk = {
      kind: asked.kind,
      tmdbId: asked.tmdbId,
      seasons: asked.kind === 'series' ? asked.seasons : null,
      ...(asked.libraryId === undefined ? {} : { libraryId: asked.libraryId }),
      ...(asked.profileId === undefined ? {} : { profileId: asked.profileId }),
    };
    const profile = await profileForAsk(asker, wanted);

    if (profile.kind === 'refused') {
      return { kind: 'refused', status: profile.status, message: profile.error };
    }

    const drafted = await draftFor(asker, wanted, profile.profileId);

    if (drafted.kind === 'refused') {
      return { kind: 'refused', status: drafted.status, message: drafted.error };
    }

    const answer = await throughRequests(
      asker,
      (client) => client.addRequest({ ...drafted.draft, isApproved: true }),
      ['requests.ask'],
    );

    if (answer.kind !== 'answered') {
      return { kind: 'refused', status: answer.status, message: answer.error };
    }

    sayOfAsk(answer.value.request, answer.value.isNew, true);

    return { kind: 'asked', request: answer.value.request };
  };

  return {
    readLink: async () => (await settings.read()).seerr,
    isRequestingOn: requestsClient !== null,
    profiles: async () => {
      const answer = await requestsClient?.listProfiles();

      return answer?.kind === 'answered'
        ? answer.value
            .filter((profile) => profile.kind === 'video')
            .map((profile) => ({ id: profile.id, name: profile.name }))
        : [];
    },
    libraries: async (kind: ArrKind) =>
      Promise.all(
        (await library.list(asTheServer))
          .filter((entry) => entry.kind === LIBRARY_KIND_OF[kind] && entry.takesRequests)
          .map(async (entry) => {
            const path = entry.requestPath ?? entry.path;

            return { id: entry.id, name: entry.name, path, ...(await roomOn(path)) };
          }),
      ),
    requests: everyRequest,
    downloads: async () => {
      const answer = await requestsClient?.downloads();

      return answer?.kind === 'answered' ? answer.value.downloads : [];
    },
    describe: (tmdbId, kind) => describeForRequest(tmdbId, kind),
    filmsHeld: (tmdbIds) => discovery.lookup.films(tmdbIds),
    seriesHeld: (tmdbIds) => discovery.lookup.series(tmdbIds),
    episodesHeld: (tmdbId) => discovery.lookup.episodesHeld(tmdbId.toString()),
    seriesOfTvdbId,
    ask,
    withdraw: async (request) => {
      const answer = await requestsClient?.removeRequest(request.id, true);

      if (answer?.kind === 'answered') {
        sayRequestsChanged();
      }
    },
  };
};

export { arrEmulationOf };
