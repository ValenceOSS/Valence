import { randomUUID } from 'node:crypto';
import { IndexerDraftSchema, ReleaseSearchSchema } from '@ValenceContracts/schemas/Indexer';
import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import type {
  Indexer,
  IndexerChange,
  IndexerDraft,
  IndexerHealth,
  IndexerTest,
  ReleaseSearch,
  ReleaseSearchOutcome,
} from '@ValenceContracts/schemas/Indexer';
import type { IndexerClient } from '@ValenceRequests/indexers/createIndexerClient';
import type { IndexerRecord, IndexerStore } from '@ValenceRequests/indexers/IndexerRecord';

type CreateIndexerServiceOptions = {
  store: IndexerStore;
  client: IndexerClient;
  now?: () => Date;
  turnOffAfter?: number;
  failingAfter?: number;
};

const TURN_OFF_AFTER = 5;

const FAILING_AFTER = 3;

const UNASKABLE = 'The indexer could not be asked';

/**
 * Shows an indexer as it may be shown, which is without its key.
 *
 * @param record - The indexer as kept.
 * @returns The indexer as shown.
 */
const shown = ({ apiKey, ...rest }: IndexerRecord): Indexer => ({
  ...rest,
  hasApiKey: apiKey !== '',
});

/**
 * Keeps the indexers, tries them, and searches every one that is on at once.
 *
 * An indexer that keeps failing is turned off rather than asked forever, with the reason kept beside
 * it: after a few failures in a row it counts as failing, which the server hears about, and after a
 * few more it is switched off. Any answer at all clears the count, and switching one back on by hand
 * clears the reason.
 *
 * @param store - Where indexers are kept.
 * @param client - How to ask them.
 * @param now - The clock.
 * @param turnOffAfter - How many failures in a row switch an indexer off.
 * @param failingAfter - How many failures in a row count as failing.
 * @returns The service.
 */
const createIndexerService = ({
  store,
  client,
  now = () => new Date(),
  turnOffAfter = TURN_OFF_AFTER,
  failingAfter = FAILING_AFTER,
}: CreateIndexerServiceOptions) => {
  const succeeded = async (record: IndexerRecord, changes: Partial<IndexerRecord> = {}) => {
    if (record.failures > 0 || Object.keys(changes).length > 0) {
      await store.update(record.id, {
        ...changes,
        failures: 0,
        lastProblem: null,
        updatedAt: now().toISOString(),
      });
    }
  };

  const failed = async (record: IndexerRecord, problem: string) => {
    const failures = record.failures + 1;
    const isTurningOff = record.isEnabled && failures >= turnOffAfter;

    await store.update(record.id, {
      failures,
      lastProblem: problem,
      lastFailedAt: now().toISOString(),
      ...(isTurningOff
        ? {
            isEnabled: false,
            turnedOffBecause: `Turned off after ${failures.toString()} failures in a row: ${problem}`,
          }
        : {}),
    });
  };

  const tryOut = async (record: IndexerRecord): Promise<IndexerTest> => {
    try {
      return { isWorking: true, problem: null, capabilities: await client.capabilities(record) };
    } catch (error) {
      return {
        isWorking: false,
        problem: error instanceof IndexerFailure ? error.message : UNASKABLE,
        capabilities: null,
      };
    }
  };

  return {
    list: async (): Promise<Indexer[]> =>
      (await store.list())
        .toSorted(
          (left, right) => left.priority - right.priority || left.name.localeCompare(right.name),
        )
        .map(shown),

    add: async (draft: IndexerDraft): Promise<Indexer> => {
      const read = IndexerDraftSchema.parse(draft);
      const at = now().toISOString();

      return shown(
        await store.insert({
          ...read,
          id: randomUUID(),
          capabilities: null,
          failures: 0,
          lastProblem: null,
          lastFailedAt: null,
          turnedOffBecause: null,
          createdAt: at,
          updatedAt: at,
        }),
      );
    },

    change: async (id: string, change: IndexerChange): Promise<Indexer | null> => {
      const current = await store.find(id);

      if (current === null) {
        return null;
      }

      const isSwitchedOn = change.isEnabled === true && !current.isEnabled;
      const isMoved = change.url !== undefined && change.url !== current.url;
      const updated = await store.update(id, {
        ...Object.fromEntries(Object.entries(change).filter(([, value]) => value !== undefined)),
        ...(isSwitchedOn ? { turnedOffBecause: null, failures: 0, lastProblem: null } : {}),
        ...(isMoved ? { capabilities: null } : {}),
        updatedAt: now().toISOString(),
      });

      return updated === null ? null : shown(updated);
    },

    remove: (id: string): Promise<boolean> => store.remove(id),

    test: async (id: string): Promise<IndexerTest | null> => {
      const record = await store.find(id);

      if (record === null) {
        return null;
      }

      const outcome = await tryOut(record);

      await (outcome.isWorking
        ? succeeded(record, { capabilities: outcome.capabilities })
        : failed(record, outcome.problem ?? UNASKABLE));

      return outcome;
    },

    tryDraft: async (draft: IndexerDraft, id?: string): Promise<IndexerTest> => {
      const read = IndexerDraftSchema.parse(draft);
      const kept = id === undefined ? null : await store.find(id);

      return tryOut({
        ...read,
        apiKey: read.apiKey === '' ? (kept?.apiKey ?? '') : read.apiKey,
        id: kept?.id ?? randomUUID(),
        capabilities: null,
        failures: 0,
        lastProblem: null,
        lastFailedAt: null,
        turnedOffBecause: null,
        createdAt: now().toISOString(),
        updatedAt: now().toISOString(),
      });
    },

    search: async (asked: ReleaseSearch): Promise<ReleaseSearchOutcome> => {
      const search = ReleaseSearchSchema.parse(asked);
      const asking = (await store.list())
        .filter(
          (record) =>
            record.isEnabled &&
            (search.indexerIds === undefined || search.indexerIds.includes(record.id)),
        )
        .toSorted((left, right) => left.priority - right.priority);

      const answers = await Promise.all(
        asking.map(async (record) => {
          const started = Date.now();

          try {
            const releases = await client.search(record, search);

            await succeeded(record);

            return {
              releases,
              report: {
                indexerId: record.id,
                indexerName: record.name,
                found: releases.length,
                tookMs: Date.now() - started,
                problem: null,
              },
            };
          } catch (error) {
            const problem = error instanceof IndexerFailure ? error.message : UNASKABLE;

            await failed(record, problem);

            return {
              releases: [],
              report: {
                indexerId: record.id,
                indexerName: record.name,
                found: 0,
                tookMs: Date.now() - started,
                problem,
              },
            };
          }
        }),
      );

      return {
        releases: answers.flatMap((answer) => answer.releases),
        indexers: answers.map((answer) => answer.report),
      };
    },

    health: async (): Promise<IndexerHealth> => {
      const records = await store.list();

      return {
        total: records.length,
        enabled: records.filter((record) => record.isEnabled).length,
        failing: records.flatMap((record) =>
          record.turnedOffBecause !== null
            ? [{ id: record.id, name: record.name, problem: record.turnedOffBecause }]
            : record.isEnabled && record.failures >= failingAfter
              ? [{ id: record.id, name: record.name, problem: record.lastProblem ?? 'Failing' }]
              : [],
        ),
      };
    },
  };
};

type IndexerService = ReturnType<typeof createIndexerService>;

export type { IndexerService };

export { createIndexerService };
