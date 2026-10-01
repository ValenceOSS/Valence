import { randomUUID } from 'node:crypto';
import type { Said } from '@ValenceI18n/SaidSchema';
import { saying } from '@ValenceI18n/saying';
import { ArrAppDraftSchema, FulfillingArrAppKindSchema } from '@ValenceContracts/schemas/ArrApp';
import type {
  ArrApp,
  ArrAppChange,
  ArrAppChoices,
  ArrAppDraft,
  ArrAppTest,
  ArrQueue,
  ArrQueueApp,
  ArrQueueItem,
  ProwlarrImport,
} from '@ValenceContracts/schemas/ArrApp';
import { ArrAppFailure } from '@ValenceRequests/arrApps/ArrAppFailure';
import type { ArrAppRecord, ArrAppStore } from '@ValenceRequests/arrApps/ArrAppRecord';
import type { ArrCaller } from '@ValenceRequests/arrApps/createArrCaller';
import type { ProwlarrSync } from '@ValenceRequests/arrApps/createProwlarrSync';
import { queueItemOf } from '@ValenceRequests/arrApps/queueItemOf';
import { readArrChoices } from '@ValenceRequests/arrApps/readArrChoices';
import { readArrQueue } from '@ValenceRequests/arrApps/readArrQueue';
import { ArrStatusSchema } from '@ValenceRequests/arrApps/schemas/ArrStatusSchema';

type CreateArrAppServiceOptions = {
  store: ArrAppStore;
  connect: (app: ArrAppRecord) => Pick<ArrCaller, 'read'>;
  prowlarr: Pick<ProwlarrSync, 'sync' | 'forget'>;
  now?: () => Date;
};

type Refused = { refused: Said };

const UNASKABLE = saying('requests.arrApps.arrAppService.theAppCouldNotBeAsked');

/**
 * An app as it may be shown: whether it has a key, and never what the key is.
 *
 * @param record - The app as kept.
 * @returns It as shown.
 */
const shown = (record: ArrAppRecord): ArrApp => ({
  id: record.id,
  name: record.name,
  kind: record.kind,
  url: record.url,
  hasApiKey: record.apiKey !== '',
  remotePath: record.remotePath,
  localPath: record.localPath,
  isEnabled: record.isEnabled,
  isWorking: record.isWorking,
  version: record.version,
  lastCheckedAt: record.lastCheckedAt,
  lastProblem: record.lastProblem,
  lastProblemCode: record.lastProblemCode,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

/**
 * Keeps the connected Radarr, Sonarr, Lidarr and Prowlarr apps and asks them what the admin needs:
 * whether each answers and which version it is, the root folders and profiles a library handed to
 * one may choose from, everything in their queues, and Prowlarr's indexers to bring in.
 *
 * @param store - Where apps are kept.
 * @param connect - How to ask an app.
 * @param prowlarr - Brings Prowlarr's indexers in, and lets them go.
 * @param now - The clock.
 * @returns The service.
 */
const createArrAppService = ({
  store,
  connect,
  prowlarr,
  now = () => new Date(),
}: CreateArrAppServiceOptions) => {
  const tryOut = async (record: ArrAppRecord): Promise<ArrAppTest> => {
    try {
      const status = await connect(record).read('/system/status', ArrStatusSchema);
      const answering = status.appName?.toLowerCase() ?? record.kind;

      return answering === record.kind
        ? { isWorking: true, problem: null, problemCode: null, version: status.version }
        : {
            isWorking: false,
            problem: saying('requests.arrApps.arrAppService.thatAddressIsAppNotKind', {
              app: status.appName ?? '',
              kind: record.kind,
            }),
            problemCode: null,
            version: status.version,
          };
    } catch (error) {
      return {
        isWorking: false,
        problem: error instanceof ArrAppFailure ? error.said : UNASKABLE,
        problemCode: error instanceof ArrAppFailure ? error.problemCode : null,
        version: null,
      };
    }
  };

  const remember = async (record: ArrAppRecord, test: ArrAppTest) => {
    await store.update(record.id, {
      isWorking: test.isWorking,
      version: test.version ?? record.version,
      lastCheckedAt: now().toISOString(),
      lastProblem: test.problem,
      lastProblemCode: test.problemCode,
    });
  };

  const asking = async <Value>(
    id: string,
    ask: (record: ArrAppRecord) => Promise<Value | Refused>,
  ): Promise<Value | Refused | null> => {
    const record = await store.find(id);

    if (record === null) {
      return null;
    }

    try {
      return await ask(record);
    } catch (error) {
      if (error instanceof ArrAppFailure) {
        return { refused: error.said };
      }

      throw error;
    }
  };

  return {
    records: (): Promise<ArrAppRecord[]> => store.list(),

    list: async (): Promise<ArrApp[]> =>
      (await store.list())
        .toSorted((left, right) => left.name.localeCompare(right.name))
        .map(shown),

    add: async (draft: ArrAppDraft): Promise<ArrApp> => {
      const at = now().toISOString();

      return shown(
        await store.insert({
          ...ArrAppDraftSchema.parse(draft),
          id: randomUUID(),
          isWorking: null,
          version: null,
          lastCheckedAt: null,
          lastProblem: null,
          lastProblemCode: null,
          createdAt: at,
          updatedAt: at,
        }),
      );
    },

    change: async (id: string, change: ArrAppChange): Promise<ArrApp | null> => {
      const updated = await store.update(id, {
        ...Object.fromEntries(
          Object.entries(change).filter(
            ([name, value]) => value !== undefined && !(name === 'apiKey' && value === ''),
          ),
        ),
        updatedAt: now().toISOString(),
      });

      return updated === null ? null : shown(updated);
    },

    remove: async (id: string): Promise<boolean> => {
      const record = await store.find(id);

      if (record?.kind === 'prowlarr') {
        await prowlarr.forget(record);
      }

      return store.remove(id);
    },

    test: async (id: string): Promise<ArrAppTest | null> => {
      const record = await store.find(id);

      if (record === null) {
        return null;
      }

      const test = await tryOut(record);

      await remember(record, test);

      return test;
    },

    tryDraft: async (draft: ArrAppDraft, id?: string): Promise<ArrAppTest> => {
      const kept = id === undefined ? null : await store.find(id);
      const read = ArrAppDraftSchema.parse(draft);
      const at = now().toISOString();

      return tryOut({
        ...read,
        apiKey: read.apiKey === '' ? (kept?.apiKey ?? '') : read.apiKey,
        id: kept?.id ?? randomUUID(),
        isWorking: null,
        version: null,
        lastCheckedAt: null,
        lastProblem: null,
        lastProblemCode: null,
        createdAt: at,
        updatedAt: at,
      });
    },

    choices: (id: string): Promise<ArrAppChoices | Refused | null> =>
      asking<ArrAppChoices>(id, (record) => {
        const kind = FulfillingArrAppKindSchema.safeParse(record.kind);

        return kind.success
          ? readArrChoices(connect(record), kind.data)
          : Promise.resolve({
              refused: saying('requests.arrApps.arrAppService.prowlarrTakesNoRequests'),
            });
      }),

    importIndexers: (id: string): Promise<ProwlarrImport | Refused | null> =>
      asking<ProwlarrImport>(id, (record) =>
        record.kind === 'prowlarr'
          ? prowlarr.sync(record)
          : Promise.resolve({
              refused: saying('requests.arrApps.arrAppService.onlyProwlarrHasIndexersToImport'),
            }),
      ),

    syncProwlarr: async (): Promise<
      Array<{ app: ArrAppRecord; outcome: ProwlarrImport | Said }>
    > => {
      const synced: Array<{ app: ArrAppRecord; outcome: ProwlarrImport | Said }> = [];

      for (const app of await store.list()) {
        if (app.kind === 'prowlarr' && app.isEnabled) {
          try {
            synced.push({ app, outcome: await prowlarr.sync(app) });
          } catch (error) {
            synced.push({ app, outcome: error instanceof ArrAppFailure ? error.said : UNASKABLE });
          }
        }
      }

      return synced;
    },

    queue: async (): Promise<ArrQueue> => {
      const fulfilling = (await store.list()).flatMap((record) => {
        const kind = FulfillingArrAppKindSchema.safeParse(record.kind);

        return kind.success && record.isEnabled ? [{ record, kind: kind.data }] : [];
      });
      const read = await Promise.all(
        fulfilling.map(
          async ({ record, kind }): Promise<{ app: ArrQueueApp; items: ArrQueueItem[] }> => {
            const app = { id: record.id, name: record.name, kind };

            try {
              return {
                app: { ...app, problem: null, problemCode: null },
                items: (await readArrQueue(connect(record))).map((one) =>
                  queueItemOf(record.id, one),
                ),
              };
            } catch (error) {
              return {
                app: {
                  ...app,
                  problem: error instanceof ArrAppFailure ? error.said : UNASKABLE,
                  problemCode: error instanceof ArrAppFailure ? error.problemCode : null,
                },
                items: [],
              };
            }
          },
        ),
      );

      return {
        apps: read
          .map((one) => one.app)
          .toSorted((left, right) => left.name.localeCompare(right.name)),
        items: read.flatMap((one) => one.items),
      };
    },
  };
};

type ArrAppService = ReturnType<typeof createArrAppService>;

export type { ArrAppService };

export { createArrAppService };
