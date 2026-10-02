import { z } from 'zod';
import { saying } from '@ValenceI18n/saying';
import { FulfillingArrAppKindSchema } from '@ValenceContracts/schemas/ArrApp';
import { ARR_IMPORT_SOURCE_NAMES } from '@ValenceContracts/constants/ARR_IMPORT_SOURCE_NAMES';
import type { ArrImportSource } from '@ValenceContracts/schemas/ArrImport';
import { ArrAppFailure } from '@ValenceRequests/arrApps/ArrAppFailure';
import type { ArrCaller } from '@ValenceRequests/arrApps/createArrCaller';
import { ArrStatusSchema } from '@ValenceRequests/arrApps/schemas/ArrStatusSchema';
import { ProwlarrIndexerSchema } from '@ValenceRequests/arrApps/schemas/ProwlarrIndexerSchema';
import type {
  ArrImportRead,
  ArrSetup,
  ProwlarrSetup,
  SeerrSetup,
  SourceRead,
} from '@ValenceRequests/arrImport/ArrSetup';
import { readArrSetup } from '@ValenceRequests/arrImport/readArrSetup';
import { readSeerrSetup } from '@ValenceRequests/arrImport/readSeerrSetup';
import { sameAddress } from '@ValenceRequests/arrImport/sameAddress';

type ArrImportConnect = (
  source: Pick<SourceRead, 'name' | 'kind' | 'url' | 'apiKey'>,
) => Pick<ArrCaller, 'read'>;

/**
 * The host of an address, to tell two apps of the same name apart.
 *
 * @param url - The address.
 * @returns Its host.
 */
const hostOf = (url: string): string => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

/**
 * Reads everything an admin pointed Valence at — every Radarr, Sonarr and Lidarr, a Prowlarr, and
 * any Overseerr or Jellyseerr, along with the Radarr and Sonarr servers those send requests to,
 * which are read with the keys they keep for them unless the admin gave the same app already —
 * saying of each which version it is or why it could not be read, and asking without changing
 * anything.
 *
 * @param sources - What the admin gave.
 * @param connect - How to ask an app.
 * @returns What was read.
 */
const readArrImport = async (
  sources: readonly ArrImportSource[],
  connect: ArrImportConnect,
): Promise<ArrImportRead> => {
  const statusOf = async (
    source: ArrImportSource,
    foundThrough: string | null,
  ): Promise<SourceRead> => {
    const name = ARR_IMPORT_SOURCE_NAMES[source.kind];
    const isSeerr = source.kind === 'overseerr' || source.kind === 'jellyseerr';

    try {
      const status = await connect({ ...source, name }).read(
        isSeerr ? '/status' : '/system/status',
        ArrStatusSchema,
      );
      const app = status.appName?.toLowerCase();

      return {
        ...source,
        name: status.instanceName?.trim() || name,
        version: status.version,
        foundThrough,
        problem:
          !isSeerr && app !== undefined && app !== source.kind
            ? saying('requests.arrApps.arrAppService.thatAddressIsAppNotKind', {
                app: status.appName ?? '',
                kind: source.kind,
              })
            : null,
      };
    } catch (error) {
      if (!(error instanceof ArrAppFailure)) {
        throw error;
      }

      return { ...source, name, version: null, foundThrough, problem: error.said };
    }
  };

  const read: SourceRead[] = [];
  const seerrs: SeerrSetup[] = [];

  for (const source of sources.filter(
    (one) => one.kind === 'overseerr' || one.kind === 'jellyseerr',
  )) {
    const status = await statusOf(source, null);

    read.push(status);

    if (status.problem === null) {
      try {
        seerrs.push(await readSeerrSetup(connect(status), status));
      } catch (error) {
        if (!(error instanceof ArrAppFailure)) {
          throw error;
        }

        status.problem = error.said;
      }
    }
  }

  const given = sources.filter((one) => FulfillingArrAppKindSchema.safeParse(one.kind).success);
  const found = seerrs.flatMap((seerr) =>
    seerr.servers
      .filter(
        (server) =>
          !given.some((one) => one.kind === server.kind && sameAddress(one.url, server.url)),
      )
      .map((server) => ({
        source: { kind: server.kind, url: server.url, apiKey: server.apiKey },
        through: seerr.source.name,
      })),
  );
  const asked: { source: ArrImportSource; through: string | null }[] = [
    ...given.map((source) => ({ source, through: null })),
    ...found.filter(
      (one, index) =>
        found.findIndex(
          (other) =>
            other.source.kind === one.source.kind && sameAddress(other.source.url, one.source.url),
        ) === index,
    ),
  ];
  const arrStatuses: SourceRead[] = [];

  for (const { source, through } of asked) {
    arrStatuses.push(await statusOf(source, through));
  }

  const prowlarrSource = sources.find((one) => one.kind === 'prowlarr');
  const prowlarrStatus = prowlarrSource === undefined ? null : await statusOf(prowlarrSource, null);

  read.push(...arrStatuses, ...(prowlarrStatus === null ? [] : [prowlarrStatus]));

  const repeated = new Set(
    read.map((one) => one.name).filter((name, index, names) => names.indexOf(name) !== index),
  );

  for (const one of read) {
    if (repeated.has(one.name)) {
      one.name = `${one.name} (${hostOf(one.url)})`;
    }
  }

  const arrs: ArrSetup[] = [];

  for (const status of arrStatuses) {
    const kind = FulfillingArrAppKindSchema.safeParse(status.kind);

    if (status.problem === null && kind.success) {
      try {
        arrs.push(await readArrSetup(connect(status), kind.data, status));
      } catch (error) {
        if (!(error instanceof ArrAppFailure)) {
          throw error;
        }

        status.problem = error.said;
      }
    }
  }

  let prowlarr: ProwlarrSetup | null = null;

  if (prowlarrStatus !== null && prowlarrStatus.problem === null) {
    try {
      const indexers = await connect(prowlarrStatus).read(
        '/indexer',
        z.array(ProwlarrIndexerSchema),
      );

      prowlarr = {
        source: prowlarrStatus,
        indexerCount: indexers.filter(
          (one) => one.protocol === 'torrent' || one.protocol === 'usenet',
        ).length,
      };
    } catch (error) {
      if (!(error instanceof ArrAppFailure)) {
        throw error;
      }

      prowlarrStatus.problem = error.said;
    }
  }

  return { sources: read, arrs, prowlarr, seerrs };
};

export type { ArrImportConnect };

export { readArrImport };
