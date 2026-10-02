import { saying } from '@ValenceI18n/saying';
import type { Said } from '@ValenceI18n/SaidSchema';
import type {
  ArrImportApplied,
  ArrImportOrder,
  ArrImportPlan,
  ArrLibrarySetting,
} from '@ValenceContracts/schemas/ArrImport';
import { ArrAppFailure } from '@ValenceRequests/arrApps/ArrAppFailure';
import type { ArrAppRecord } from '@ValenceRequests/arrApps/ArrAppRecord';
import type { ArrAppService } from '@ValenceRequests/arrApps/createArrAppService';
import type { ProwlarrSync } from '@ValenceRequests/arrApps/createProwlarrSync';
import type { DownloadClientService } from '@ValenceRequests/downloads/createDownloadClientService';
import type { IndexerService } from '@ValenceRequests/indexers/createIndexerService';
import type { ProfileService } from '@ValenceRequests/profiles/createProfileService';
import type { ArrSetup, SourceRead } from '@ValenceRequests/arrImport/ArrSetup';
import { isWithin } from '@ValenceRequests/arrImport/isWithin';
import { planArrImport } from '@ValenceRequests/arrImport/planArrImport';
import type { ArrImportWork } from '@ValenceRequests/arrImport/planArrImport';
import { profileSourceOf } from '@ValenceRequests/arrImport/profileSourceOf';
import { readArrImport } from '@ValenceRequests/arrImport/readArrImport';
import type { ArrImportConnect } from '@ValenceRequests/arrImport/readArrImport';
import { sameAddress } from '@ValenceRequests/arrImport/sameAddress';
import { wantedOf } from '@ValenceRequests/arrImport/wantedOf';

type CreateArrImportServiceOptions = {
  connect: ArrImportConnect;
  clients: Pick<DownloadClientService, 'records' | 'add' | 'change'>;
  indexers: Pick<IndexerService, 'list' | 'add' | 'change'>;
  profiles: Pick<ProfileService, 'list' | 'add'>;
  apps: Pick<ArrAppService, 'records' | 'add' | 'change'>;
  prowlarr: Pick<ProwlarrSync, 'sync'>;
};

/**
 * Brings a Radarr, Sonarr, Lidarr, Prowlarr and Overseerr or Jellyseerr setup into Valence's
 * requests service, reading from them and never writing to them: first as a plan of what it would
 * do, then doing it — adding the download clients, indexers and quality profiles Valence lacks,
 * connecting the apps the admin hands libraries to and the Prowlarr whose indexers it brings in,
 * and saying how each library is to be fulfilled and what was being waited for, for the server to
 * set and to ask for. Running it again adds nothing twice: each thing is found again by what it is,
 * its address or its name, and a password or key typed in on a later run is filled into the one
 * already added.
 *
 * @param connect - How to ask an app.
 * @param clients - Valence's download clients.
 * @param indexers - Valence's indexers.
 * @param profiles - Valence's quality profiles.
 * @param apps - The connected apps.
 * @param prowlarr - Brings a Prowlarr's indexers in.
 * @returns The import.
 */
const createArrImportService = ({
  connect,
  clients,
  indexers,
  profiles,
  apps,
  prowlarr,
}: CreateArrImportServiceOptions) => {
  const work = async (order: ArrImportOrder): Promise<ArrImportWork> => {
    const read = await readArrImport(order.sources, connect);
    const [heldClients, heldIndexers, heldProfiles, heldApps] = await Promise.all([
      clients.records(),
      indexers.list(),
      profiles.list(),
      apps.records(),
    ]);

    return planArrImport(
      read,
      { clients: heldClients, indexers: heldIndexers, profiles: heldProfiles, apps: heldApps },
      order,
    );
  };

  const connected = async (
    source: SourceRead,
    kind: ArrAppRecord['kind'],
    paths: { remotePath: string; localPath: string },
  ): Promise<{ record: ArrAppRecord; isNew: boolean } | null> => {
    const kept = (await apps.records()).find(
      (record) => record.kind === kind && sameAddress(record.url, source.url),
    );

    if (kept !== undefined) {
      if (kept.apiKey !== source.apiKey) {
        await apps.change(kept.id, { apiKey: source.apiKey });
      }

      return { record: { ...kept, apiKey: source.apiKey }, isNew: false };
    }

    const added = await apps.add({
      name: source.name.slice(0, 80),
      kind,
      url: source.url,
      apiKey: source.apiKey,
      ...paths,
    });
    const record = (await apps.records()).find((one) => one.id === added.id);

    return record === undefined ? null : { record, isNew: true };
  };

  return {
    plan: async (order: ArrImportOrder): Promise<ArrImportPlan> => (await work(order)).plan,

    apply: async (order: ArrImportOrder): Promise<ArrImportApplied> => {
      const done = await work(order);
      const problems: Said[] = done.read.sources.flatMap((source) =>
        source.problem === null
          ? []
          : [
              saying('requests.arrImport.nameCouldNotBeReadProblem', {
                name: source.name,
                problem: source.problem,
              }),
            ],
      );
      const applied: Omit<ArrImportApplied, 'libraries' | 'wanted' | 'problems'> = {
        clients: { added: 0, kept: 0 },
        indexers: { added: 0, kept: 0 },
        profiles: { added: 0, kept: 0 },
        apps: { added: 0, kept: 0 },
        prowlarr: null,
      };

      for (const { draft, existing } of done.clients) {
        if (draft === null) {
          continue;
        }

        if (existing === null) {
          await clients.add(draft);
          applied.clients.added += 1;
          continue;
        }

        const password = draft.password ?? '';
        const apiKey = draft.apiKey ?? '';

        if (
          (password !== '' && password !== existing.password) ||
          (apiKey !== '' && apiKey !== existing.apiKey)
        ) {
          await clients.change(existing.id, {
            ...(password === '' ? {} : { password }),
            ...(apiKey === '' ? {} : { apiKey }),
          });
        }

        applied.clients.kept += 1;
      }

      for (const { draft, existing, report } of done.indexers) {
        if (draft === null) {
          continue;
        }

        if (existing === null) {
          const added = await indexers.add(draft);

          if ('refused' in added) {
            problems.push(
              saying('requests.arrImport.nameCouldNotBeAddedProblem', {
                name: report.name,
                problem: added.refused,
              }),
            );
          } else {
            applied.indexers.added += 1;
          }

          continue;
        }

        if ((draft.apiKey ?? '') !== '') {
          await indexers.change(existing.id, { apiKey: draft.apiKey ?? '' });
        }

        applied.indexers.kept += 1;
      }

      const profileIds = new Map<string, string>();

      for (const { draft, existing, report } of done.profiles) {
        if (existing === null) {
          profileIds.set(report.key, (await profiles.add(draft)).id);
          applied.profiles.added += 1;
        } else {
          profileIds.set(report.key, existing.id);
          applied.profiles.kept += 1;
        }
      }

      const count = (isNew: boolean) => {
        if (isNew) {
          applied.apps.added += 1;
        } else {
          applied.apps.kept += 1;
        }
      };

      if (done.read.prowlarr !== null) {
        const app = await connected(done.read.prowlarr.source, 'prowlarr', {
          remotePath: '',
          localPath: '',
        });

        if (app !== null) {
          count(app.isNew);

          try {
            applied.prowlarr = await prowlarr.sync(app.record);
          } catch (error) {
            if (!(error instanceof ArrAppFailure)) {
              throw error;
            }

            problems.push(error.said);
          }
        }
      }

      const libraries: ArrLibrarySetting[] = [];
      const handedTo = new Map<ArrSetup, ArrAppRecord | null>();

      for (const library of done.libraries) {
        const choice = order.choices[library.report.libraryId] ?? 'handOff';
        const libraryId = library.report.libraryId;

        if (choice === 'leave') {
          continue;
        }

        if (choice === 'takeOver') {
          libraries.push({
            libraryId,
            choice,
            fulfilment: null,
            profileId:
              library.profile === null
                ? null
                : (profileIds.get(library.profile.report.key) ?? null),
          });
          continue;
        }

        if (!handedTo.has(library.setup)) {
          const mapping = order.pathMappings.find((one) => isWithin(library.rootFolder, one.from));
          const app = await connected(library.setup.source, library.setup.kind, {
            remotePath: mapping?.from ?? '',
            localPath: mapping?.to ?? '',
          });

          if (app !== null) {
            count(app.isNew);
          }

          handedTo.set(library.setup, app?.record ?? null);
        }

        const app = handedTo.get(library.setup) ?? null;

        if (app === null || library.arrProfileId === null || library.rootFolder === '') {
          problems.push(
            saying('requests.arrImport.libraryCouldNotBeHandedToApp', {
              library: library.report.libraryName,
              app: library.setup.source.name,
            }),
          );
          continue;
        }

        libraries.push({
          libraryId,
          choice,
          fulfilment: {
            appId: app.id,
            rootFolderPath: library.rootFolder,
            qualityProfileId: library.arrProfileId,
            metadataProfileId: library.metadataProfileId,
            searchesOnAdd: true,
          },
          profileId: null,
        });
      }

      const { wanted } = wantedOf(done.read, {
        libraryOf: done.libraryOf,
        profileOf: (setup, arrProfileId) => {
          if (arrProfileId === null || arrProfileId === undefined) {
            return null;
          }

          const profile = done.profiles.find((one) =>
            one.sources.includes(profileSourceOf(setup, arrProfileId)),
          );

          return profile === undefined ? null : (profileIds.get(profile.report.key) ?? null);
        },
      });

      return { ...applied, libraries, wanted, problems };
    },
  };
};

type ArrImportService = ReturnType<typeof createArrImportService>;

export type { ArrImportService };

export { createArrImportService };
