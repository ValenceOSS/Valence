import { z } from 'zod';

const STORAGE_KEY = 'valence.liveTv.lastChannel';

const ChannelIdSchema = z.string().uuid();

/**
 * Reads which live TV channel this viewer last watched, on this device, so the page opens back on
 * it rather than on the first channel.
 *
 * @returns The channel, or nothing where none was watched here or it cannot be read.
 */
const readLastChannel = (): string | null => {
  try {
    const parsed = ChannelIdSchema.safeParse(window.localStorage.getItem(STORAGE_KEY));

    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};

/**
 * Remembers which live TV channel this viewer is watching, on this device.
 *
 * @param channelId - The channel.
 */
const saveLastChannel = (channelId: string): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, channelId);
  } catch {}
};

export { readLastChannel, saveLastChannel };
