import { makeMutable } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { PLACE } from '@ValenceMobile/components/APageStack/PLACE';
import type { AHeldStack, AStackedPage } from './APageStack.types';

/**
 * The stack as it stands once its pages change: the slot each page is drawn in, which a page
 * swapped in for the one on top takes over so it carries on from where that one stood, and where
 * each slot stands — a page opened on top starting off to the side, any other starting where it
 * would be beneath it, and the pages there at the start already in place.
 *
 * @param held - The stack as it stood, or nothing for the first pages it is given.
 * @param pages - The pages now, bottom first.
 * @param leaving - The page still drawn on its way out, whose slot nothing else may take.
 * @returns The stack now.
 */
const stackAfter = (
  held: AHeldStack | null,
  pages: readonly AStackedPage[],
  leaving: AStackedPage | null,
): AHeldStack => {
  const gone = held?.pages.at(-1) ?? null;
  const arrived = pages.at(-1) ?? null;
  const swappedFrom =
    held !== null &&
    gone !== null &&
    arrived !== null &&
    pages.length === held.pages.length &&
    gone.key !== arrived.key
      ? (held.slots.get(gone.key) ?? gone.key)
      : null;
  const isLeavingDrawn = leaving !== null && !pages.some((page) => page.key === leaving.key);
  const wanted = [
    ...(isLeavingDrawn
      ? [{ key: leaving.key, slot: held?.slots.get(leaving.key) ?? leaving.key }]
      : []),
    ...pages.map((page, index) => ({
      key: page.key,
      slot:
        (index === pages.length - 1 ? swappedFrom : null) ?? held?.slots.get(page.key) ?? page.key,
    })),
  ];
  const slots = wanted.reduce((taken, { key, slot }) => {
    const inUse = new Set(taken.values());
    const free = [slot, ...wanted.map((_, more) => `${slot}+${more.toString()}`)].find(
      (one) => !inUse.has(one),
    );

    return new Map([...taken, [key, free ?? key]]);
  }, new Map<string, string>());
  const places = new Map<string, SharedValue<number>>(
    [...slots].map(([key, slot]) => {
      const index = pages.findIndex((page) => page.key === key);
      const isOnTop = index === pages.length - 1;

      return [
        slot,
        held?.places.get(slot) ??
          makeMutable<number>(
            !isOnTop ? PLACE.under : held === null || index === 0 ? PLACE.inPlace : PLACE.off,
          ),
      ];
    }),
  );

  return { pages, slots, places };
};

export { stackAfter };
