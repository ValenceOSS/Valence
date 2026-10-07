import { rulesAround } from '@ValenceTv/focus/rulesAround';

/**
 * Has every remembering guide around something the remote landed on keep it, so coming back into
 * the guide later lands there again.
 *
 * @param landed - What the remote landed on.
 */
const rememberWhereFocusWent = (landed: EventTarget | null): void => {
  if (!(landed instanceof HTMLElement)) {
    return;
  }

  for (const { rule } of rulesAround(landed)) {
    if (rule.isRemembering) {
      rule.lastFocused = landed;
    }
  }
};

export { rememberWhereFocusWent };
