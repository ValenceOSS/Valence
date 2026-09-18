const STORAGE_KEY = 'valence.sidebarCollapsed';

/**
 * Reads whether this viewer left the admin/account sidebar folded to icons. Held on the device
 * rather than on the profile, since a wide monitor and a laptop want different answers from the
 * same account.
 */
const readSidebarCollapsed = (): boolean => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

/**
 * Remembers whether this viewer left the sidebar folded to icons, on this device.
 *
 * @param isCollapsed - Whether the sidebar is folded.
 */
const saveSidebarCollapsed = (isCollapsed: boolean): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, isCollapsed ? 'true' : 'false');
  } catch {}
};

export { readSidebarCollapsed, saveSidebarCollapsed };
