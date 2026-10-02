import type {
  ArrImportOrder,
  ArrImportPlan,
  ArrImportSecret,
} from '@ValenceContracts/schemas/ArrImport';
import type { Indexer } from '@ValenceContracts/schemas/Indexer';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';
import type { ArrAppRecord } from '@ValenceRequests/arrApps/ArrAppRecord';
import type { DownloadClientRecord } from '@ValenceRequests/downloads/DownloadClientRecord';
import type { ArrImportRead } from '@ValenceRequests/arrImport/ArrSetup';
import { libraryForPath } from '@ValenceRequests/arrImport/libraryForPath';
import { plannedClientsOf } from '@ValenceRequests/arrImport/plannedClientsOf';
import type { PlannedClient } from '@ValenceRequests/arrImport/plannedClientsOf';
import { plannedIndexersOf } from '@ValenceRequests/arrImport/plannedIndexersOf';
import type { PlannedIndexer } from '@ValenceRequests/arrImport/plannedIndexersOf';
import { plannedLibrariesOf } from '@ValenceRequests/arrImport/plannedLibrariesOf';
import type { PlannedLibrary } from '@ValenceRequests/arrImport/plannedLibrariesOf';
import { plannedProfilesOf } from '@ValenceRequests/arrImport/plannedProfilesOf';
import type { PlannedProfile } from '@ValenceRequests/arrImport/plannedProfilesOf';
import { sameAddress } from '@ValenceRequests/arrImport/sameAddress';
import { wantedOf } from '@ValenceRequests/arrImport/wantedOf';
import type { WantedPlacing } from '@ValenceRequests/arrImport/wantedOf';

type ArrImportHeld = {
  clients: DownloadClientRecord[];
  indexers: Indexer[];
  profiles: QualityProfile[];
  apps: ArrAppRecord[];
};

type ArrImportWork = {
  plan: ArrImportPlan;
  read: ArrImportRead;
  clients: PlannedClient[];
  indexers: PlannedIndexer[];
  profiles: PlannedProfile[];
  libraries: PlannedLibrary[];
  libraryOf: WantedPlacing['libraryOf'];
};

/**
 * What bringing a setup in would do, without doing any of it: each download client, indexer and
 * quality profile and whether it is new or Valence has it already, which library each app's root
 * folders are, how much was being waited for, what Valence cannot bring across and why, and every
 * password and key that has to be typed in again because the app shows it only masked.
 *
 * @param read - What was read from the apps.
 * @param held - What Valence has already.
 * @param order - What the admin asked for.
 * @returns The plan, and the work it stands for.
 */
const planArrImport = (
  read: ArrImportRead,
  held: ArrImportHeld,
  order: Pick<ArrImportOrder, 'pathMappings' | 'secrets' | 'libraries'>,
): ArrImportWork => {
  const clients = plannedClientsOf(read.arrs, held.clients, order.secrets, order.pathMappings);
  const indexers = plannedIndexersOf(
    read.arrs,
    held.indexers,
    order.secrets,
    read.prowlarr?.source.url ?? null,
  );
  const profiles = plannedProfilesOf(read.arrs, held.profiles);
  const placed = plannedLibrariesOf(read.arrs, order.libraries, order.pathMappings, profiles);
  const libraryOf: WantedPlacing['libraryOf'] = (path, kind) =>
    path === null
      ? null
      : (libraryForPath(path, kind, order.libraries, order.pathMappings)?.library.id ?? null);
  const { wanted, unaskable } = wantedOf(read, { libraryOf, profileOf: () => null });
  const secrets = new Map<string, ArrImportSecret>();

  for (const secret of [
    ...clients.flatMap((one) => one.secrets),
    ...indexers.flatMap((one) => (one.secret === null ? [] : [one.secret])),
  ]) {
    const kept = secrets.get(secret.key);

    secrets.set(
      secret.key,
      kept === undefined ? secret : { ...kept, from: [...new Set([...kept.from, ...secret.from])] },
    );
  }

  return {
    plan: {
      sources: read.sources.map(({ kind, url, name, version, foundThrough, problem }) => ({
        kind,
        url,
        name,
        version,
        foundThrough,
        problem,
      })),
      clients: clients.map((one) => one.report),
      indexers: indexers.map((one) => one.report),
      prowlarr:
        read.prowlarr === null
          ? null
          : {
              name: read.prowlarr.source.name,
              url: read.prowlarr.source.url,
              indexerCount: read.prowlarr.indexerCount,
              standing: held.apps.some(
                (app) =>
                  app.kind === 'prowlarr' && sameAddress(app.url, read.prowlarr?.source.url ?? ''),
              )
                ? 'kept'
                : 'new',
            },
      profiles: profiles.map((one) => one.report),
      libraries: placed.libraries.map((one) => one.report),
      unplacedFolders: placed.unplaced,
      wanted: {
        films: wanted.filter((one) => one.kind === 'film' && one.requester === null).length,
        series: wanted.filter((one) => one.kind === 'series' && one.requester === null).length,
        artists: wanted.filter((one) => one.kind === 'artist').length,
        requests: wanted.filter((one) => one.requester !== null).length,
        unaskable,
      },
      secrets: [...secrets.values()],
    },
    read,
    clients,
    indexers,
    profiles,
    libraries: placed.libraries,
    libraryOf,
  };
};

export type { ArrImportHeld, ArrImportWork };

export { planArrImport };
