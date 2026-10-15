import { platformInUse } from '@ValenceClient/platform/installPlatform';

const STORAGE_KEY = 'valence.dismissedAnnouncement';

/**
 * Which announcement was last put away on this device, so it stays away until a new one is posted.
 *
 * @returns Its identifier, or null where none has been put away.
 */
const readDismissedAnnouncement = (): string | null => {
  try {
    return platformInUse().store.read(STORAGE_KEY);
  } catch {
    return null;
  }
};

/**
 * Remembers that an announcement was put away on this device.
 *
 * @param id - The announcement put away.
 * @returns Nothing.
 */
const dismissAnnouncement = (id: string): void => {
  try {
    platformInUse().store.write(STORAGE_KEY, id);
  } catch {}
};

export { dismissAnnouncement, readDismissedAnnouncement };
