import { z } from 'zod';

const STORAGE_KEY = 'valence.fileDetailsWidth';

const NARROWEST = 260;

const WIDEST = 560;

const DEFAULT_WIDTH = 320;

const WidthSchema = z.coerce.number().int().min(NARROWEST).max(WIDEST);

/**
 * Reads how wide the admin dragged the file manager's details, held on the device since the right
 * width depends on the screen rather than on who is looking.
 *
 * @returns The width remembered, or the usual one when there is none.
 */
const readFileDetailsWidth = (): number => {
  try {
    const parsed = WidthSchema.safeParse(window.localStorage.getItem(STORAGE_KEY) ?? undefined);

    return parsed.success ? parsed.data : DEFAULT_WIDTH;
  } catch {
    return DEFAULT_WIDTH;
  }
};

/**
 * Remembers how wide the file manager's details were left, on this device.
 *
 * @param width - The width it settled at.
 */
const saveFileDetailsWidth = (width: number): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, width.toString());
  } catch {}
};

export {
  DEFAULT_WIDTH,
  NARROWEST,
  STORAGE_KEY,
  WIDEST,
  readFileDetailsWidth,
  saveFileDetailsWidth,
};
