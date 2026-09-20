import { z } from 'zod';

const STORAGE_KEY = 'valence.dismissedConcerns';

const DismissedSchema = z.array(z.string()).max(200);

/**
 * Reads the concerns this viewer dismissed from the admin page's banner, on this device, as their
 * keys.
 *
 * @returns The keys, or none where nothing was kept or it could not be read.
 */
const readDismissedConcerns = (): string[] => {
  try {
    const kept = DismissedSchema.safeParse(
      JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]'),
    );

    return kept.success ? kept.data : [];
  } catch {
    return [];
  }
};

/**
 * Remembers the concerns this viewer dismissed, on this device.
 *
 * @param keys - The dismissed concerns' keys.
 */
const saveDismissedConcerns = (keys: readonly string[]): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch {}
};

export { readDismissedConcerns, saveDismissedConcerns };
