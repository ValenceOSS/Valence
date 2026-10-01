import { z } from 'zod';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { BrowseOrderSchema } from '@ValenceClient/library/BrowseOrder';
import type { BrowseOrder } from '@ValenceClient/library/BrowseOrder';

const ArrangementSchema = z.object({
  order: BrowseOrderSchema.catch('added'),
  isHidingWatched: z.boolean().catch(false),
});

type Arrangement = { order: BrowseOrder; isHidingWatched: boolean };

const StoredSchema = z.record(z.string(), ArrangementSchema).catch({});

const STORAGE_KEY = 'valence.browseArrangement';

const DEFAULT_ARRANGEMENT: Arrangement = { order: 'added', isHidingWatched: false };

/**
 * Reads every page's arrangement this device remembers, or none where what it holds cannot be read.
 *
 * @returns The arrangements, by page.
 */
const readEveryArrangement = (): Record<string, Arrangement> => {
  try {
    return StoredSchema.parse(JSON.parse(platformInUse().store.read(STORAGE_KEY) ?? '{}'));
  } catch {
    return {};
  }
};

/**
 * Reads how this viewer likes a page of the library ordered on this device, and whether they leave
 * out what they have watched.
 *
 * @param kind - Which page, since films and programmes are often wanted in different orders.
 * @returns The arrangement, or the newest first with everything shown where none was kept.
 */
const readBrowseArrangement = (kind: string): Arrangement =>
  readEveryArrangement()[kind] ?? DEFAULT_ARRANGEMENT;

/**
 * Remembers how this viewer likes a page of the library arranged, on this device.
 *
 * @param kind - Which page.
 * @param arrangement - The order and whether to leave out what has been watched.
 */
const saveBrowseArrangement = (kind: string, arrangement: Arrangement): void => {
  platformInUse().store.write(
    STORAGE_KEY,
    JSON.stringify({ ...readEveryArrangement(), [kind]: arrangement }),
  );
};

export type { Arrangement };

export { DEFAULT_ARRANGEMENT, STORAGE_KEY, readBrowseArrangement, saveBrowseArrangement };
