import { z } from 'zod';

const STORAGE_KEY = 'valence.updateStepsShown';

/**
 * Reads whether this viewer left the steps for updating open on the updates page, on this device,
 * folded until they have been opened.
 *
 * @returns Whether the steps are shown.
 */
const readUpdateStepsShown = (): boolean => {
  try {
    const held = window.localStorage.getItem(STORAGE_KEY);

    return held === null ? false : z.boolean().catch(false).parse(JSON.parse(held));
  } catch {
    return false;
  }
};

/**
 * Remembers whether this viewer left the steps for updating open, on this device.
 *
 * @param isShown - Whether the steps are shown.
 */
const saveUpdateStepsShown = (isShown: boolean): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(isShown));
  } catch {}
};

export { readUpdateStepsShown, saveUpdateStepsShown };
