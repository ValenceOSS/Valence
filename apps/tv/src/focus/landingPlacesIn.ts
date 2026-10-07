import { rulesAround } from '@ValenceTv/focus/rulesAround';

const LANDABLE = '[tabindex]:not([tabindex="-1"])';

/**
 * Whether an element takes up any of the screen, which nothing hidden does.
 *
 * @param element - The element.
 * @returns Whether it is drawn.
 */
const isDrawn = (element: Element): boolean => {
  const { width, height } = element.getBoundingClientRect();

  return width > 0 && height > 0;
};

/**
 * Everything inside an element the remote could land on: focusable, drawn, and not behind a shut
 * fence.
 *
 * @param within - Where to look.
 * @returns What it could land on.
 */
const landingPlacesIn = (within: Element): HTMLElement[] =>
  [...within.querySelectorAll<HTMLElement>(LANDABLE)].filter(
    (element) => isDrawn(element) && !rulesAround(element).some(({ rule }) => rule.isShut),
  );

export { landingPlacesIn };
