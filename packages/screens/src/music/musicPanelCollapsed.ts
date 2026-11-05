const STORAGE_KEY = 'valence.musicPanelCollapsed';

/**
 * Reads whether this viewer collapsed the column beside the music, on this device, since a wide
 * monitor and a laptop want different answers from the same account.
 *
 * @returns Whether it was collapsed.
 */
const readMusicPanelCollapsed = (): boolean => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

/**
 * Remembers whether this viewer collapsed the column beside the music, on this device.
 *
 * @param isCollapsed - Whether it is collapsed.
 */
const saveMusicPanelCollapsed = (isCollapsed: boolean): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, isCollapsed ? 'true' : 'false');
  } catch {}
};

export { readMusicPanelCollapsed, saveMusicPanelCollapsed };
