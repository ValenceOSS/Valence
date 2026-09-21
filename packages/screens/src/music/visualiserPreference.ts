import { VISUALISERS } from '@ValenceScreens/music/visualisers/VISUALISERS';

const KEY = 'valence.visualiser';

/**
 * The visualiser somebody last chose, so the page opens on it again.
 *
 * @returns Its place in the list of visualisers, the first where none was chosen or the choice is gone.
 */
const readVisualiserChoice = (): number => {
  try {
    const found = VISUALISERS.findIndex((one) => one.id === window.localStorage.getItem(KEY));

    return Math.max(found, 0);
  } catch {
    return 0;
  }
};

/**
 * Remembers which visualiser somebody chose.
 *
 * @param at - Its place in the list of visualisers.
 */
const saveVisualiserChoice = (at: number): void => {
  const chosen = VISUALISERS[at];

  if (chosen === undefined) {
    return;
  }

  try {
    window.localStorage.setItem(KEY, chosen.id);
  } catch {
    return;
  }
};

export { readVisualiserChoice, saveVisualiserChoice };
