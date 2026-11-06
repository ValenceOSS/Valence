/**
 * Remembers which columns of Media's list this viewer hid, on this device.
 *
 * @param hidden - The columns' ids.
 */
const saveHiddenColumns = (hidden: readonly string[]): void => {
  try {
    window.localStorage.setItem('valence.mediaHiddenColumns', JSON.stringify(hidden));
  } catch {}
};

export { saveHiddenColumns };
