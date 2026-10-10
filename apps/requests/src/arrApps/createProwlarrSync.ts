import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { ProwlarrImport } from '@ValenceContracts/schemas/ArrApp';
import type { ArrAppRecord } from '@ValenceRequests/arrApps/ArrAppRecord';
import type { ArrCaller } from '@ValenceRequests/arrApps/createArrCaller';
import { ProwlarrIndexerSchema } from '@ValenceRequests/arrApps/schemas/ProwlarrIndexerSchema';
import type { ProwlarrIndexer } from '@ValenceRequests/arrApps/schemas/ProwlarrIndexerSchema';
import type { IndexerRecord, IndexerStore } from '@ValenceRequests/indexers/IndexerRecord';
import { createTurns } from '@ValenceRequests/timing/createTurns';

type CreateProwlarrSyncOptions = {
  indexers: IndexerStore;
  connect: (app: ArrAppRecord) => Pick<ArrCaller, 'read'>;
  now?: () => Date;
};

type Synced = Pick<IndexerRecord, 'name' | 'kind' | 'url' | 'apiKey' | 'priority' | 'categories'>;

const ProwlarrIndexersSchema = z.array(ProwlarrIndexerSchema);

const OWN_CATEGORIES_FROM = 100_000;

/**
 * An indexer of Prowlarr's as Valence searches it: through Prowlarr's own Torznab or Newznab feed
 * for it, with Prowlarr's key, under its name and priority, asking for the standard categories it
 * says it has.
 *
 * @param app - The Prowlarr.
 * @param listed - The indexer, as Prowlarr lists it.
 * @returns What Valence keeps of it.
 */
const syncedOf = (app: ArrAppRecord, listed: ProwlarrIndexer): Synced => ({
  name: listed.name.slice(0, 80),
  kind: listed.protocol === 'usenet' ? 'newznab' : 'torznab',
  url: `${app.url.replace(/\/+$/, '')}/${listed.id.toString()}/api`,
  apiKey: app.apiKey,
  priority: Math.min(50, Math.max(1, listed.priority)),
  categories: (listed.capabilities?.categories ?? [])
    .map((category) => category.id)
    .filter((id) => id < OWN_CATEGORIES_FROM)
    .toSorted((left, right) => left - right),
});

/**
 * Keeps Valence's indexers in step with a Prowlarr: one Torznab or Newznab indexer for each of
 * Prowlarr's, made, changed or removed as Prowlarr's are, while indexers made by hand are never
 * touched and one Valence switched off for failing stays off until it is tested again.
 *
 * Work on one Prowlarr is done a piece at a time, so the hourly sync and an administrator's import
 * cannot both read the indexers before either has added any and each add the same one.
 *
 * @param indexers - Where indexers are kept.
 * @param connect - How to ask Prowlarr.
 * @param now - The clock.
 * @returns The sync.
 */
const createProwlarrSync = ({
  indexers,
  connect,
  now = () => new Date(),
}: CreateProwlarrSyncOptions) => {
  const inTurn = createTurns();

  const sync = async (app: ArrAppRecord): Promise<ProwlarrImport> => {
    const listed = (await connect(app).read('/indexer', ProwlarrIndexersSchema)).filter(
      (one) => one.protocol === 'torrent' || one.protocol === 'usenet',
    );
    const kept = (await indexers.list()).filter((record) => record.sourceAppId === app.id);
    const at = now().toISOString();
    const done: ProwlarrImport = { added: 0, updated: 0, removed: 0, unchanged: 0 };

    for (const one of listed) {
      const synced = syncedOf(app, one);
      const record = kept.find((each) => each.sourceIndexerId === one.id);

      if (record === undefined) {
        await indexers.insert({
          ...synced,
          id: randomUUID(),
          definitionId: null,
          settings: {},
          session: null,
          removesWhenDone: null,
          seedSeconds: null,
          seedRatio: null,
          isEnabled: one.enable,
          requestsPerMinute: null,
          timeoutSeconds: 30,
          capabilities: null,
          failures: 0,
          lastProblem: null,
          lastProblemCode: null,
          lastFailedAt: null,
          turnedOffBecause: null,
          sourceAppId: app.id,
          sourceIndexerId: one.id,
          createdAt: at,
          updatedAt: at,
        });
        done.added += 1;
        continue;
      }

      const isEnabled = one.enable && (record.turnedOffBecause === null || record.isEnabled);
      const wanted = { ...synced, isEnabled };
      const isChanged = JSON.stringify({ ...record, ...wanted }) !== JSON.stringify(record);

      if (!isChanged) {
        done.unchanged += 1;
        continue;
      }

      await indexers.update(record.id, {
        ...wanted,
        ...(synced.url === record.url ? {} : { capabilities: null, session: null }),
        updatedAt: at,
      });
      done.updated += 1;
    }

    for (const record of kept) {
      if (!listed.some((one) => one.id === record.sourceIndexerId)) {
        await indexers.remove(record.id);
        done.removed += 1;
      }
    }

    return done;
  };

  const forget = async (app: Pick<ArrAppRecord, 'id'>): Promise<number> => {
    const kept = (await indexers.list()).filter((record) => record.sourceAppId === app.id);

    for (const record of kept) {
      await indexers.remove(record.id);
    }

    return kept.length;
  };

  return {
    sync: (app: ArrAppRecord): Promise<ProwlarrImport> => inTurn(app.id, () => sync(app)),
    forget: (app: Pick<ArrAppRecord, 'id'>): Promise<number> => inTurn(app.id, () => forget(app)),
  };
};

type ProwlarrSync = ReturnType<typeof createProwlarrSync>;

export type { ProwlarrSync };

export { createProwlarrSync };
