import type { SavedView } from './SavedView.types';

/**
 * Remembers the views of Media's list this viewer saved, on this device.
 *
 * @param views - The views.
 */
const saveSavedViews = (views: readonly SavedView[]): void => {
  try {
    window.localStorage.setItem('valence.mediaSavedViews', JSON.stringify(views));
  } catch {}
};

export { saveSavedViews };
