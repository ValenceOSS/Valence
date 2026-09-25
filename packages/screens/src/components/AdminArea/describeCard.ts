import type { Monitor } from '@ValenceClient/admin/fetchAdmin';
import { say } from '@ValenceI18n/say';

/**
 * Names the card on the overview, and says in the same line what it would not tell us.
 *
 * The tile beside this one carries a number and has room for four words about it. This has room for
 * a sentence, and it is the only place an operator finds out that a figure covers Valence's own
 * transcodes rather than the silicon — which is the difference between a card that is idle and a
 * card somebody else is using.
 *
 * @param graphics - What the monitor read from the card, or null where there is nothing readable.
 * @returns The line to print against "Graphics".
 */
const describeCard = (graphics: Monitor['resources']['graphics']): string => {
  if (graphics === null) {
    return say('admin.describeCard.noneReadable');
  }

  if (graphics.measured === 'valenceOnly') {
    return say('admin.describeCard.valenceOnly', { name: graphics.name });
  }

  return graphics.encoderPercent === null
    ? say('admin.describeCard.encoderUnreadable', { name: graphics.name })
    : graphics.name;
};

export { describeCard };
