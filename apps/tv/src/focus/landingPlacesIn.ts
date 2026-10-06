import { rulesAround } from '@ValenceTv/focus/rulesAround';

const LANDABLE = '[tabindex]:not([tabindex="-1"])';

/**
 * Everything inside an element the remote could land on: focusable, drawn, and not behind a shut
 * fence.
 *
 * @param within - Where to look.
 * @returns What it could land on.
 */
const landingPlacesIn = (within: Element): HTMLElement[] =>
  [...within.querySelectorAll<HTMLElement>(LANDABLE)].filter(
    (element) =>
      element.getClientRects().length > 0 && !rulesAround(element).some(({ rule }) => rule.isShut),
  );

export { landingPlacesIn };
