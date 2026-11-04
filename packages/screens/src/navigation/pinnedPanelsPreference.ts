import { z } from 'zod';

const STORAGE_KEY = 'valence.pinnedPanels';

const PinnedSchema = z.array(z.string()).max(12);

const FOLDED_INTO: Readonly<Record<string, string>> = { files: 'media' };

/**
 * Reads which admin pages this viewer pinned to the top of the sidebar, on this device, in the order
 * they were pinned, a page folded into another standing for the one it is now part of.
 *
 * @returns The pages' ids.
 */
const readPinnedPanels = (): string[] => {
  try {
    const held = window.localStorage.getItem(STORAGE_KEY);
    const parsed = held === null ? null : PinnedSchema.safeParse(JSON.parse(held));

    return parsed?.success === true
      ? [...new Set(parsed.data.map((id) => FOLDED_INTO[id] ?? id))]
      : [];
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
