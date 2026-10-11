import { z } from 'zod';

const LiveViewSchema = z.enum(['list', 'guide']);

const STORAGE_KEY = 'valence.liveTv.view';

/**
 * Reads whether this viewer last looked at live TV as a list of channels or as a timeline guide,
 * on this device, falling back to the list.
 *
 * @returns The view.
 */
const readLiveView = (): 'list' | 'guide' => {
  try {
    const parsed = LiveViewSchema.safeParse(window.localStorage.getItem(STORAGE_KEY));

    return parsed.success ? parsed.data : 'list';
  } catch {
    return 'list';
  }
};

/**
 * Remembers whether this viewer wants live TV as a list or a guide, on this device.
 *
 * @param view - The view chosen.
 */
const saveLiveView = (view: 'list' | 'guide'): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, view);
  } catch {}
};

export { readLiveView, saveLiveView };
