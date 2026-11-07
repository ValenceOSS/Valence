const STORAGE_KEY = 'valence.adminNavPlace';

/**
 * Where the admin area's sections were last put on this device: down a sidebar, or across a bar at
 * the top.
 *
 * @returns Where to put them, the sidebar where nothing has been chosen or it cannot be read.
 */
const readAdminNavPlace = (): 'side' | 'top' => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'top' ? 'top' : 'side';
  } catch {
    return 'side';
  }
};

/**
 * Remembers where the admin area's sections are put on this device.
 *
 * @param place - Down a sidebar, or across a bar at the top.
 */
const saveAdminNavPlace = (place: 'side' | 'top'): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, place);
  } catch {}
};

export { readAdminNavPlace, saveAdminNavPlace };
