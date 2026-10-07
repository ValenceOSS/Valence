import { placeOnScreen } from '@ValenceTv/testing/placeOnScreen';
import type { Box } from '@ValenceTv/focus/Box';

/**
 * Something the remote can land on, drawn at a place on the page, for a test of the web focus engine.
 *
 * @param within - What it is put inside.
 * @param name - What it is called.
 * @param box - Where it is drawn.
 * @returns The element.
 */
const aLandingPlace = (within: Element, name: string, box: Box): HTMLElement => {
  const place = document.createElement('div');

  place.tabIndex = 0;
  place.setAttribute('aria-label', name);
  placeOnScreen(place, box);
  within.append(place);

  return place;
};

export { aLandingPlace };
