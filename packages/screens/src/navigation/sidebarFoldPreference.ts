import { z } from 'zod';

const STORAGE_KEY = 'valence.sidebarFolds';

const FoldsSchema = z.record(z.string(), z.boolean());

/**
 * Reads which of the sidebar's groups this viewer left open or folded, on this device, by group.
 * A group missing from the answer has never been touched and takes its own starting state.
 */
const readSidebarFolds = (): Record<string, boolean> => {
  try {
    const held = window.localStorage.getItem(STORAGE_KEY);

    if (held === null) {
      return {};
    }

    const parsed = FoldsSchema.safeParse(JSON.parse(held));

    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
};

/**
 * Remembers which of the sidebar's groups this viewer left open, on this device.
 *
 * @param folds - Whether each group touched so far is open, by group.
 */
const saveSidebarFolds = (folds: Record<string, boolean>): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(folds));
  } catch {}
};

export { readSidebarFolds, saveSidebarFolds };
