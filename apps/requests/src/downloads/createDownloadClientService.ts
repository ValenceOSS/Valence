import { randomUUID } from 'node:crypto';
import { DownloadClientDraftSchema } from '@ValenceContracts/schemas/DownloadClient';
import { DownloadClientFailure } from '@ValenceRequests/downloads/DownloadClientFailure';
import type {
  DownloadClient,
  DownloadClientChange,
  DownloadClientDraft,
  DownloadClientTest,
} from '@ValenceContracts/schemas/DownloadClient';
import type { DownloadClientAdapter } from '@ValenceRequests/downloads/DownloadClientAdapter';
import type {
  DownloadClientRecord,
  DownloadClientStore,
} from '@ValenceRequests/downloads/DownloadClientRecord';

type CreateDownloadClientServiceOptions = {
  store: DownloadClientStore;
  adapterFor: (record: DownloadClientRecord) => DownloadClientAdapter;
  now?: () => Date;
};

const UNASKABLE = 'The client could not be asked';

/**
 * A client as it may be shown: whether it has a password or key, and never what they are.
 *
 * @param record - The client as kept.
 * @returns It as shown.
 */
const shown = (record: DownloadClientRecord): DownloadClient => ({
  id: record.id,
  name: record.name,
  kind: record.kind,
  url: record.url,
  username: record.username,
  hasPassword: record.password !== '',
  hasApiKey: record.apiKey !== '',
  categories: record.categories,
  remotePath: record.remotePath,
  localPath: record.localPath,
  priority: record.priority,
  isEnabled: record.isEnabled,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

/**
 * Keeps the download clients, tries them, and hands out one adapter for each — made again only
 * when the client is changed, so a login it holds is reused rather than repeated.
 *
 * A password or key is written and never read back. Leaving one blank when changing a client, or
 * when trying a change, keeps the one it has.
 *
 * @param store - Where clients are kept.
 * @param adapterFor - How to speak to a client.
 * @param now - The clock.
 * @returns The service.
 */
const createDownloadClientService = ({
  store,
  adapterFor,
  now = () => new Date(),
}: CreateDownloadClientServiceOptions) => {
  const adapters = new Map<string, { updatedAt: string; adapter: DownloadClientAdapter }>();

  const adapterOf = (record: DownloadClientRecord): DownloadClientAdapter => {
    const held = adapters.get(record.id);

    if (held !== undefined && held.updatedAt === record.updatedAt) {
      return held.adapter;
    }

    const adapter = adapterFor(record);

    adapters.set(record.id, { updatedAt: record.updatedAt, adapter });

    return adapter;
  };

  const tryOut = async (adapter: DownloadClientAdapter): Promise<DownloadClientTest> => {
    try {
      return {
        isWorking: true,
        problem: null,
        problemCode: null,
        version: await adapter.version(),
      };
    } catch (error) {
      return {
        isWorking: false,
        problem: error instanceof DownloadClientFailure ? error.message : UNASKABLE,
        problemCode: error instanceof DownloadClientFailure ? error.problemCode : null,
        version: null,
      };
    }
  };

  return {
    records: (): Promise<DownloadClientRecord[]> => store.list(),

    adapterOf,

    list: async (): Promise<DownloadClient[]> =>
      (await store.list())
        .toSorted(
          (left, right) => left.priority - right.priority || left.name.localeCompare(right.name),
        )
        .map(shown),

    add: async (draft: DownloadClientDraft): Promise<DownloadClient> => {
      const at = now().toISOString();

      return shown(
        await store.insert({
          ...DownloadClientDraftSchema.parse(draft),
          id: randomUUID(),
          createdAt: at,
          updatedAt: at,
        }),
      );
    },

    change: async (id: string, change: DownloadClientChange): Promise<DownloadClient | null> => {
      const updated = await store.update(id, {
        ...Object.fromEntries(
          Object.entries(change).filter(
            ([name, value]) =>
              value !== undefined && !((name === 'password' || name === 'apiKey') && value === ''),
          ),
        ),
        updatedAt: now().toISOString(),
      });

      adapters.delete(id);

      return updated === null ? null : shown(updated);
    },

    remove: async (id: string): Promise<boolean> => {
      adapters.delete(id);

      return store.remove(id);
    },

    test: async (id: string): Promise<DownloadClientTest | null> => {
      const record = await store.find(id);

      return record === null ? null : tryOut(adapterOf(record));
    },

    tryDraft: async (draft: DownloadClientDraft, id?: string): Promise<DownloadClientTest> => {
      const kept = id === undefined ? null : await store.find(id);
      const read = DownloadClientDraftSchema.parse(draft);

      return tryOut(
        adapterFor({
          ...read,
          password: read.password === '' ? (kept?.password ?? '') : read.password,
          apiKey: read.apiKey === '' ? (kept?.apiKey ?? '') : read.apiKey,
          id: kept?.id ?? randomUUID(),
          createdAt: now().toISOString(),
          updatedAt: now().toISOString(),
        }),
      );
    },
  };
};

type DownloadClientService = ReturnType<typeof createDownloadClientService>;

export type { DownloadClientService };

export { createDownloadClientService };
