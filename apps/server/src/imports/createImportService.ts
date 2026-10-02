import { randomUUID } from 'node:crypto';
import type { Said } from '@ValenceI18n/SaidSchema';
import { saying } from '@ValenceI18n/saying';
import type {
  ConnectMediaImport,
  CreateImportLibraries,
  CreatedImportLibrary,
  ImportedSetupLinks,
  LinkImportLibrary,
  MediaImportLibraries,
  MediaImportPerson,
  MediaImportRun,
  MediaImportSource,
  MediaImportStatus,
  PathMapping,
  PlanMediaImport,
  PlexPin,
} from '@ValenceContracts/schemas/MediaImport';
import type { SetupLinkLifetime } from '@ValenceContracts/schemas/SetupLink';
import { asTheServer } from '@ValenceServer/visibility/asTheServer';
import { IMPORT_PLAN_JOB, IMPORT_RUN_JOB } from '@ValenceServer/jobs/JobQueue';
import { SourceFailure } from './SourceFailure';
import { createPlexTvCaller } from './createPlexTvCaller';
import { createSourceReader } from './createSourceReader';
import { libraryLinkKey } from './libraryLinkKey';
import { locateSourceLibraries } from './locateSourceLibraries';
import { mapSourcePath } from './mapSourcePath';
import { planImport } from './planImport';
import { readerOfSource } from './readerOfSource';
import { resolvePlexHomeToken } from './resolvePlexHomeToken';
import { runImport } from './runImport';
import { tidyPath } from './tidyPath';
import type { ImportServices } from './ImportServices';
import type { StoredImportRun, StoredImportSource } from './ImportRecords';

type Refused = { kind: 'refused'; reason: Said };

const LIBRARY_LINK = 'library';

/**
 * What went wrong, as words for whoever is importing.
 *
 * @param error - What was thrown.
 * @returns Its words.
 */
const reasonOf = (error: Error | null): Said =>
  error instanceof SourceFailure
    ? error.said
    : saying('server.imports.importService.somethingWentWrongReadingTheSource');

/**
 * A source as an administrator's browser sees it, which never includes its key.
 *
 * @param source - The source as stored.
 * @returns The source to show.
 */
const shownSource = (source: StoredImportSource): MediaImportSource => ({
  id: source.id,
  kind: source.kind,
  name: source.name,
  url: source.url,
  version: source.details.version,
  createdAt: source.createdAt.toISOString(),
});

/**
 * Brings a Jellyfin, Emby or Plex server's people, watching and libraries into Valence: connect and
 * test a source, map its folders, make and scan its libraries, plan an import without writing
 * anything, carry it out as a job, and hand out each new person's setup link.
 *
 * @param services - What the import works with.
 * @returns The import service.
 */
const createImportService = (services: ImportServices) => {
  const { store, jobs } = services;

  const shownRun = (run: StoredImportRun): MediaImportRun => {
    const live = run.jobId === null ? null : jobs.readProgress(run.jobId);
    const isMoving = run.state === 'planning' || run.state === 'importing';

    return {
      id: run.id,
      sourceId: run.sourceId,
      state: run.state,
      report: run.report,
      failure: run.failure,
      progress:
        isMoving && live !== null
          ? { phase: live.phase, processed: live.processed, total: live.total }
          : null,
      createdAt: run.createdAt.toISOString(),
      startedAt: run.startedAt?.toISOString() ?? null,
      finishedAt: run.finishedAt?.toISOString() ?? null,
    };
  };

  const librariesOf = async (source: StoredImportSource): Promise<MediaImportLibraries> => {
    const reader = readerOfSource(services, source, await services.regions());
    const libraries = await services.library.list(asTheServer);

    return {
      mappings: source.details.pathMappings,
      libraries: locateSourceLibraries(
        await reader.libraries(),
        source.details.pathMappings,
        libraries,
        await store.links(source.id, LIBRARY_LINK),
      ),
    };
  };

  const finishJob = async (
    runId: string,
    work: () => Promise<'finished' | 'cancelled' | 'missing'>,
  ): Promise<void> => {
    try {
      const ended = await work();

      if (ended === 'cancelled') {
        await store.changeRun(runId, { state: 'cancelled', finishedAt: new Date() });
      }
    } catch (error) {
      services.log(
        `import: run ${runId} stopped: ${error instanceof Error ? error.message : String(error)}`,
      );
      await store.changeRun(runId, {
        state: 'failed',
        failure: reasonOf(error instanceof Error ? error : null),
        finishedAt: new Date(),
      });
    }
  };

  return {
    status: async (): Promise<MediaImportStatus> => ({
      sources: (await store.listSources()).map(shownSource),
      runs: (await store.latestRuns()).map(shownRun),
      requests: services.requestsReach(),
    }),

    connect: async (
      asked: ConnectMediaImport,
    ): Promise<{ kind: 'connected'; source: MediaImportSource } | Refused> => {
      const clientId = randomUUID();
      const url = asked.url.replace(/\/+$/, '');
      const reader = createSourceReader(
        { kind: asked.kind, url, token: asked.token, clientId },
        services.fetch,
        await services.regions(),
      );

      try {
        const identity = await reader.identify();

        if (asked.kind !== 'plex') {
          await reader.users();
        } else {
          await reader.libraries();
        }

        const already = (await store.listSources()).find(
          (source) => source.kind === asked.kind && source.details.serverId === identity.serverId,
        );

        if (already !== undefined) {
          const details = { ...already.details, version: identity.version };

          await store.changeSource(already.id, {
            name: identity.name,
            url,
            token: asked.token,
            details,
          });

          return {
            kind: 'connected',
            source: shownSource({ ...already, name: identity.name, url, details }),
          };
        }

        const source = await store.addSource({
          kind: asked.kind,
          name: identity.name,
          url,
          token: asked.token,
          details: {
            serverId: identity.serverId,
            version: identity.version,
            clientId,
            userTokens: {},
            pathMappings: [],
          },
        });

        return { kind: 'connected', source: shownSource(source) };
      } catch (error) {
        return { kind: 'refused', reason: reasonOf(error instanceof Error ? error : null) };
      }
    },

    forget: async (sourceId: string): Promise<boolean> => {
      if ((await store.findSource(sourceId)) === null) {
        return false;
      }

      await store.removeSource(sourceId);

      return true;
    },

    people: async (sourceId: string): Promise<MediaImportPerson[] | Refused | null> => {
      const source = await store.findSource(sourceId);

      if (source === null) {
        return null;
      }

      try {
        const reader = readerOfSource(services, source, await services.regions());

        return (await reader.users()).map((user) => ({
          id: user.id,
          name: user.name,
          isAdministrator: user.isAdministrator,
          isDisabled: user.isDisabled,
          access: user.access,
        }));
      } catch (error) {
        return { kind: 'refused', reason: reasonOf(error instanceof Error ? error : null) };
      }
    },

    givePin: async (sourceId: string, pin: PlexPin): Promise<'given' | Refused | null> => {
      const source = await store.findSource(sourceId);

      if (source?.kind !== 'plex') {
        return null;
      }

      const plexTv = createPlexTvCaller(
        services.fetch,
        source.token,
        source.details.clientId === '' ? source.id : source.details.clientId,
      );

      try {
        const token = await resolvePlexHomeToken(
          plexTv,
          source.details.serverId,
          pin.userId,
          pin.pin,
        );

        await store.changeSource(source.id, {
          details: {
            ...source.details,
            userTokens: { ...source.details.userTokens, [pin.userId]: token },
          },
        });

        return 'given';
      } catch (error) {
        return { kind: 'refused', reason: reasonOf(error instanceof Error ? error : null) };
      }
    },

    libraries: async (sourceId: string): Promise<MediaImportLibraries | Refused | null> => {
      const source = await store.findSource(sourceId);

      if (source === null) {
        return null;
      }

      try {
        return await librariesOf(source);
      } catch (error) {
        return { kind: 'refused', reason: reasonOf(error instanceof Error ? error : null) };
      }
    },

    saveMappings: async (
      sourceId: string,
      mappings: readonly PathMapping[],
    ): Promise<MediaImportLibraries | Refused | null> => {
      const source = await store.findSource(sourceId);

      if (source === null) {
        return null;
      }

      const details = {
        ...source.details,
        pathMappings: mappings.map((mapping) => ({
          from: tidyPath(mapping.from),
          to: tidyPath(mapping.to),
        })),
      };

      await store.changeSource(source.id, { details });

      try {
        return await librariesOf({ ...source, details });
      } catch (error) {
        return { kind: 'refused', reason: reasonOf(error instanceof Error ? error : null) };
      }
    },

    linkLibrary: async (
      sourceId: string,
      asked: LinkImportLibrary,
    ): Promise<MediaImportLibraries | Refused | null> => {
      const source = await store.findSource(sourceId);

      if (source === null) {
        return null;
      }

      const libraries = await services.library.list(asTheServer);

      if (!libraries.some((library) => library.id === asked.libraryId)) {
        return {
          kind: 'refused',
          reason: saying('server.imports.importService.thatLibraryIsNotInValence'),
        };
      }

      await store.setLink(
        source.id,
        LIBRARY_LINK,
        libraryLinkKey(asked.sourceLibraryId, asked.sourcePath),
        asked.libraryId,
      );

      try {
        return await librariesOf(source);
      } catch (error) {
        return { kind: 'refused', reason: reasonOf(error instanceof Error ? error : null) };
      }
    },

    createLibraries: async (
      sourceId: string,
      asked: CreateImportLibraries,
    ): Promise<CreatedImportLibrary[] | null> => {
      const source = await store.findSource(sourceId);

      if (source === null) {
        return null;
      }

      const made: CreatedImportLibrary[] = [];

      for (const wanted of asked.libraries) {
        const path = mapSourcePath(wanted.sourcePath, source.details.pathMappings);
        const existing = (await services.library.list(asTheServer)).find(
          (library) => tidyPath(library.path) === tidyPath(path),
        );
        const library =
          existing ??
          (await services.library.create({ name: wanted.name, kind: wanted.kind, path }));

        if (library === null) {
          made.push({
            sourcePath: wanted.sourcePath,
            libraryId: null,
            jobId: null,
            problem: saying('server.imports.importService.valenceCannotSeeAFolderAtPath', { path }),
          });

          continue;
        }

        await store.setLink(
          source.id,
          LIBRARY_LINK,
          libraryLinkKey(wanted.sourceLibraryId, wanted.sourcePath),
          library.id,
        );

        const scan = await services.library.scan(library.id);

        made.push({
          sourcePath: wanted.sourcePath,
          libraryId: library.id,
          jobId: scan?.jobId ?? null,
          problem: null,
        });
      }

      return made;
    },

    plan: async (
      sourceId: string,
      asked: PlanMediaImport,
      by: string | null,
    ): Promise<MediaImportRun | null> => {
      const source = await store.findSource(sourceId);

      if (source === null) {
        return null;
      }

      const run = await store.addRun(source.id, { ...asked, by });
      const jobId = await jobs.enqueue(IMPORT_PLAN_JOB, { runId: run.id }, run.id);

      await store.changeRun(run.id, { jobId });

      return shownRun({ ...run, jobId });
    },

    readRun: async (runId: string): Promise<MediaImportRun | null> => {
      const run = await store.findRun(runId);

      return run === null ? null : shownRun(run);
    },

    start: async (runId: string): Promise<MediaImportRun | 'notPlanned' | null> => {
      const run = await store.findRun(runId);

      if (run === null) {
        return null;
      }

      if (
        run.state !== 'planned' &&
        run.state !== 'completed' &&
        run.state !== 'cancelled' &&
        run.state !== 'failed'
      ) {
        return 'notPlanned';
      }

      if (run.report === null) {
        return 'notPlanned';
      }

      const jobId = await jobs.enqueue(IMPORT_RUN_JOB, { runId: run.id }, run.id);
      const restarted = run.state === 'completed';

      await store.changeRun(run.id, {
        state: 'importing',
        jobId,
        failure: null,
        finishedAt: null,
        ...(restarted ? { cursor: null } : {}),
      });

      return shownRun({
        ...run,
        state: 'importing',
        jobId,
        failure: null,
        finishedAt: null,
      });
    },

    cancel: async (runId: string): Promise<MediaImportRun | null> => {
      const run = await store.findRun(runId);

      if (run === null) {
        return null;
      }

      if (run.jobId !== null && (run.state === 'planning' || run.state === 'importing')) {
        await jobs.cancel(run.jobId);
        await store.changeRun(run.id, { state: 'cancelled', finishedAt: new Date() });

        return shownRun({ ...run, state: 'cancelled', finishedAt: new Date() });
      }

      return shownRun(run);
    },

    setupLinks: async (
      runId: string,
      lifetimeDays: SetupLinkLifetime,
      by: string | null,
      origin: string | undefined,
    ): Promise<ImportedSetupLinks | null> => {
      const run = await store.findRun(runId);

      if (run?.report === null || run === null || services.setupLinks === null) {
        return null;
      }

      const links: ImportedSetupLinks['links'] = [];

      for (const person of run.report.people) {
        if (person.outcome !== 'created' || person.userId === null) {
          continue;
        }

        const issued = await services.setupLinks.issue(person.userId, {
          lifetimeDays,
          by,
          origin,
        });

        links.push({
          userId: person.userId,
          name: person.name,
          url: issued.url,
          expiresAt: issued.expiresAt.toISOString(),
          hasEmail: person.email !== null && person.email !== '',
        });
      }

      return {
        canEmail: (await services.email?.isOn('setupLinks')) ?? false,
        links,
      };
    },

    runPlanJob: (jobId: string, runId: string): Promise<void> =>
      finishJob(runId, async () =>
        (await planImport(services, runId, jobId)) ? 'finished' : 'cancelled',
      ),

    runImportJob: (jobId: string, runId: string): Promise<void> =>
      finishJob(runId, async () => {
        const ended = await runImport(services, runId, jobId);

        return ended === 'completed' ? 'finished' : ended;
      }),
  };
};

type ImportService = ReturnType<typeof createImportService>;

export type { ImportService };

export { createImportService };
