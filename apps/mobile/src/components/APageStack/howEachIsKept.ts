import type { AKeeping, AStackedPage } from './APageStack.types';

/**
 * How each page drawn in the stack is kept: the one on top and the one beneath it, which a swipe
 * can reveal, kept live, as is one on its way out; any page that shows around a card, or around the
 * page a card shrinks back, kept on the screen though frozen; and every other page frozen and taken
 * off the screen, held as it was left until it is gone back to.
 *
 * @param drawn - The pages drawn, bottom first, with any page on its way out last.
 * @param pages - The pages in the stack, bottom first.
 * @returns How each is kept, by key.
 */
const howEachIsKept = (
  drawn: readonly AStackedPage[],
  pages: readonly AStackedPage[],
): ReadonlyMap<string, AKeeping> => {
  const topKey = pages.at(-1)?.key ?? null;
  const liveKeys = new Set([
    ...pages.slice(-2).map((page) => page.key),
    ...drawn.filter((page) => !pages.includes(page)).map((page) => page.key),
  ]);

  return new Map(
    drawn.reduceRight<{
      kept: [string, AKeeping][];
      isSeenThrough: boolean;
      isUnderACard: boolean;
    }>(
      ({ kept, isSeenThrough, isUnderACard }, page) => {
        const isLive = liveKeys.has(page.key);
        const isShown = isLive || isSeenThrough;

        return {
          kept: [
            ...kept,
            [page.key, { activity: page.key === topKey ? 2 : isShown ? 1 : 0, isFrozen: !isLive }],
          ],
          isSeenThrough: isShown && (page.isCard === true || isUnderACard),
          isUnderACard: page.isCard === true,
        };
      },
      { kept: [], isSeenThrough: false, isUnderACard: false },
    ).kept,
  );
};

export { howEachIsKept };
