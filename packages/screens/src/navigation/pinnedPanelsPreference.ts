import { z } from 'zod';

const STORAGE_KEY = 'valence.pinnedPanels';

const PinnedSchema = z.array(z.string()).max(12);

/**
 * Reads which admin pages this viewer pinned to the top of the sidebar, on this device, in the order
 * they were pinned.
 *
 * @returns The pages' ids.
 */
const readPinnedPanels = (): string[] => {
  try {
    const held = window.localStorage.getItem(STORAGE_KEY);
    const parsed = held === null ? null : PinnedSchema.safeParse(JSON.parse(held));

    return parsed?.success === true ? parsed.data : [];
  } catch {
    return [];
  }
};

/**
 * Remembers which admin pages this viewer pinned, on this device.
 *
 * @param pinned - The pages' ids, in the order they were pinned.
 */
const savePinnedPanels = (pinned: readonly string[]): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pinned));
  } catch {}
};

export { readPinnedPanels, savePinnedPanels, STORAGE_KEY };
