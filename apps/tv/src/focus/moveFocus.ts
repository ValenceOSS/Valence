import { landingPlacesIn } from '@ValenceTv/focus/landingPlacesIn';
import { nearestInDirection } from '@ValenceTv/focus/nearestInDirection';
import { nextFocusOverrides } from '@ValenceTv/focus/nextFocusOverrides';
import { rulesAround } from '@ValenceTv/focus/rulesAround';
import type { Box } from '@ValenceTv/focus/Box';
import type { Direction } from '@ValenceTv/focus/Direction';

/**
 * Where an element is drawn on the screen.
 *
 * @param element - The element.
 * @returns Its box.
 */
const boxOf = (element: Element): Box => {
  const { left, top, right, bottom } = element.getBoundingClientRect();

  return { left, top, right, bottom };
};

/**
 * Where landing on a place really takes the remote: a guide that remembers sends it back to what
 * was last landed on inside it, when it comes in from outside.
 *
 * @param from - Where the remote is.
 * @param to - Where it was going to land.
 * @returns Where it lands.
 */
const throughGuides = (from: HTMLElement, to: HTMLElement): HTMLElement => {
  const entering = rulesAround(to).filter(
    ({ at, rule }) => rule.isRemembering && !at.contains(from),
  );
  const entered = entering[entering.length - 1];
  const remembered = entered?.rule.lastFocused;

  return remembered !== undefined &&
    remembered !== null &&
    remembered.isConnected &&
    landingPlacesIn(entered?.at ?? document.body).includes(remembered)
    ? remembered
    : to;
};

/**
 * Moves the remote one step in a direction across the page, as tvOS's focus engine does: to the
 * nearest place that way, staying inside any panel that holds the remote that way, going where a
 * place says pressing that way should go, and back into a remembering guide where it was last.
 *
 * The page is scrolled to the place before it is focused, so a screen that scrolls itself on focus,
 * as the front page does back to its top for the hero, has the last word.
 *
 * @param direction - The way to move.
 * @param within - The page, the document's own unless a test says otherwise.
 * @returns Whether the remote moved.
 */
const moveFocus = (direction: Direction, within: Document = document): boolean => {
  const from = within.activeElement;

  if (!(from instanceof HTMLElement) || from === within.body) {
    const [first] = landingPlacesIn(within.body);

    first?.focus();

    return first !== undefined;
  }

  const told = nextFocusOverrides.get(from)?.[direction];

  if (told !== undefined) {
    told?.focus();

    return told !== null;
  }

  const holding = rulesAround(from).find(({ rule }) => rule.trapped.has(direction))?.at;
  const places = landingPlacesIn(holding ?? within.body)
    .filter((place) => place !== from)
    .map((place) => ({ place, box: boxOf(place) }));
  const next = nearestInDirection(boxOf(from), places, direction);

  if (next === null) {
    return false;
  }

  const landing = throughGuides(from, next);

  landing.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  landing.focus({ preventScroll: true });

  return true;
};

export { moveFocus };
