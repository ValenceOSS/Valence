import { z } from 'zod';
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
 * Reads how this viewer likes a page of the library ordered, and whether they leave out what they
 * have watched, for the kind of page it is. Held on the device, as the size of the cards is.
 *
 * @param kind - Which page, since films and programmes are often wanted in different orders.
 * @returns The arrangement, or the newest first with everything shown where none was kept.
 */
const readBrowseArrangement = (kind: string): Arrangement => {
  try {
    const held = StoredSchema.parse(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}'));

    return held[kind] ?? DEFAULT_ARRANGEMENT;
  } catch {
    return DEFAULT_ARRANGEMENT;
  }
};

/**
 * Remembers how this viewer likes a page of the library arranged, on this device.
 *
 * @param kind - Which page.
 * @param arrangement - The order and whether to leave out what has been watched.
 */
const saveBrowseArrangement = (kind: string, arrangement: Arrangement): void => {
  try {
    const held = StoredSchema.parse(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}'));

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...held, [kind]: arrangement }));
  } catch {}
};

export type { Arrangement };

export { DEFAULT_ARRANGEMENT, readBrowseArrangement, saveBrowseArrangement };
