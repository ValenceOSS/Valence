import { z } from 'zod';

const STORAGE_KEY = 'valence.mediaHiddenColumns';

const HiddenSchema = z.array(z.string()).max(20);

/**
 * Reads which columns of Media's list this viewer hid, on this device.
 *
 * @returns The columns' ids.
 */
const readHiddenColumns = (): string[] => {
  try {
    const held = window.localStorage.getItem(STORAGE_KEY);
    const parsed = held === null ? null : HiddenSchema.safeParse(JSON.parse(held));

    return parsed?.success === true ? parsed.data : [];
  } catch {
    return [];
  }
};

export { readHiddenColumns };
