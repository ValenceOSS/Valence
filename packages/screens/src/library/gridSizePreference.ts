import { z } from 'zod';
import type { MediaGridSize } from '@ValenceScreens/components/MediaGrid/MediaGrid.types';

const GridSizePreferenceSchema = z.enum(['small', 'medium', 'large']);

const STORAGE_KEY = 'valence.gridSize';

const DEFAULT_GRID_SIZE: MediaGridSize = 'medium';

/**
 * Reads how large this viewer likes the cards. Held on the device rather than on the profile, since
 * the right size depends on the screen being looked at rather than on who is looking.
 *
 * @param key - Where the choice is kept, for cards sized apart from the library's, such as the
 *   admin's session cards.
 */
const readGridSize = (key: string = STORAGE_KEY): MediaGridSize => {
  try {
    const parsed = GridSizePreferenceSchema.safeParse(window.localStorage.getItem(key));

    return parsed.success ? parsed.data : DEFAULT_GRID_SIZE;
  } catch {
    return DEFAULT_GRID_SIZE;
  }
};

/**
 * Remembers how large this viewer likes the cards, on this device — a phone and a television want
 * different answers from the same account.
 *
 * @param size - The size chosen.
 * @param key - Where the choice is kept, for cards sized apart from the library's.
 */
const saveGridSize = (size: MediaGridSize, key: string = STORAGE_KEY): void => {
  try {
    window.localStorage.setItem(key, size);
  } catch {}
};

export { DEFAULT_GRID_SIZE, STORAGE_KEY, readGridSize, saveGridSize };
