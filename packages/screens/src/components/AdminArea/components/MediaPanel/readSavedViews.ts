import { z } from 'zod';
import { TITLE_SHOWS, TITLE_SORTS } from '@ValenceContracts/schemas/TitleList';
import type { SavedView } from './SavedView.types';

const STORAGE_KEY = 'valence.mediaSavedViews';

const SavedViewsSchema = z
  .array(
    z.object({
      name: z.string().min(1).max(64),
      place: z.object({
        library: z.string().nullable(),
        search: z.string(),
        show: z.enum(TITLE_SHOWS),
        sort: z.enum(TITLE_SORTS),
        isDescending: z.boolean(),
        filters: z.array(z.string()),
      }),
    }),
  )
  .max(50);

/**
 * Reads the views of Media's list this viewer saved, on this device.
 *
 * @returns The views, in the order they were saved.
 */
const readSavedViews = (): SavedView[] => {
  try {
    const held = window.localStorage.getItem(STORAGE_KEY);
    const parsed = held === null ? null : SavedViewsSchema.safeParse(JSON.parse(held));

    return parsed?.success === true ? parsed.data : [];
  } catch {
    return [];
  }
};

export { readSavedViews };
