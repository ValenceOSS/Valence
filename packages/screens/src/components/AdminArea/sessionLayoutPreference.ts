import { z } from 'zod';

const SessionLayoutSchema = z.enum(['table', 'cards']);

const STORAGE_KEY = 'valence.sessionLayout';

/**
 * Reads whether this admin last chose to see the open sessions as a table or as cards, on this
 * device, falling back to the table.
 */
const readSessionLayout = (): 'table' | 'cards' => {
  try {
    const parsed = SessionLayoutSchema.safeParse(window.localStorage.getItem(STORAGE_KEY));

    return parsed.success ? parsed.data : 'table';
  } catch {
    return 'table';
  }
};

/**
 * Remembers whether this admin wants the open sessions as a table or as cards, on this device.
 *
 * @param layout - The way chosen.
 */
const saveSessionLayout = (layout: 'table' | 'cards'): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, layout);
  } catch {}
};

export { readSessionLayout, saveSessionLayout };
