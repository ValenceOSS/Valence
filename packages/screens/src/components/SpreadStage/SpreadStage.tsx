import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { bookPageUrl } from '@ValenceClient/books/fetchBooks';
import { PageTurn } from '@ValenceScreens/components/PageTurn/PageTurn';
import { widthFor } from '@ValenceScreens/reading/widthFor';
import type { SpreadStageProps } from './SpreadStage.types';
import { say } from '@ValenceI18n/say';

const FIT_CLASSES = {
  width: 'w-full object-contain',
  height: 'h-full object-contain',
  both: 'max-h-full max-w-full object-contain',
} as const;

const TURN_SECONDS = 0.6;

const QUICKEST_SECONDS = 0.14;

const MOST_STEPS = 6;

/**
 * How long one leaf should take when others are waiting behind it: the more turns are stacked up,
 * the quicker each goes, down to a flick that is still a page turning rather than a cut.
 *
 * @param waiting - How many more turns are waiting after this one.
 * @returns The seconds this leaf should take.
 */
const secondsFor = (waiting: number): number =>
  Math.max(QUICKEST_SECONDS, TURN_SECONDS / (1 + waiting * 1.5));

/**
 * The page or pair of pages a reader is on, drawn, and turned to the next as a book turns.
 *
 * A pair turns to a pair as a leaf hinged along the middle, the one page swinging over to the other
 * side. Anything else — a single page, a pair that meets a single — fades to the next, because there
 * is no middle to hinge on and a leaf swung over a half that is not there only breaks.
 *
 * Asked for a spread that is several turns away, as a key held down or a thumb flicked asks, it
 * turns through every page in between rather than cutting to the last, each leaf quicker than the
 * one before for the turns still waiting behind it. Asked for one a long way off, it goes most of
 * the way at once and turns the last few. Where turning is not animated, or somebody has asked for
 * less movement, the next is simply there.
 *
 * @param spreads - Every spread of the chapter, each as its pages in reading order.
 * @param spreadAt - Which spread is asked for.
 * @param bookId - The book being read.
 * @param chapterId - The chapter being read.
 * @param across - How many pages the reader shows at once, which is how wide to ask for them.
 * @param fit - How a page is fitted to the screen.
 * @param gap - The room, in pixels, between the two pages of a pair.
 * @param isRightToLeft - Whether the book is read right to left.
 * @param isAnimated - Whether turning a page is animated.
 * @param onLoaded - Told when a page has loaded, so a wide one can be given a spread of its own.
 */
const SpreadStage = ({
  spreads,
  spreadAt,
  bookId,
  chapterId,
  across,
  fit,
  gap,
  isRightToLeft,
  isAnimated,
  onLoaded,
}: SpreadStageProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const [shownAt, setShownAt] = useState(spreadAt);
  const isMoving = isAnimated && prefersReducedMotion !== true;
  const away = spreadAt - shownAt;
  const step = Math.sign(away);
  const fromAt = Math.abs(away) > MOST_STEPS ? spreadAt - step : shownAt;
  const nextAt = fromAt + step;
  const from = spreads[fromAt] ?? [];
  const to = spreads[nextAt] ?? [];
  const isLeaf = isMoving && away !== 0 && from.length === 2 && to.length === 2;
  const asked = spreads[spreadAt] ?? [];

  useEffect(() => {
    if (away !== 0 && !isLeaf) {
      setShownAt(spreadAt);
    } else if (fromAt !== shownAt) {
      setShownAt(fromAt);
    }
  }, [away, isLeaf, fromAt, shownAt, spreadAt]);

  const askedWidth = widthFor(across);

  const page = (number: number) => (
    <img
      key={number}
      src={bookPageUrl(bookId, chapterId, number, askedWidth)}
      alt={say('screens.spreadStage.pageAlt', { number: (number + 1).toString() })}
      onLoad={(event) => {
        onLoaded(number, event.currentTarget);
      }}
      className={`select-none ${FIT_CLASSES[fit]}`}
    />
  );

  if (isLeaf) {
    return (
      <PageTurn
        key={`${fromAt.toString()}-${nextAt.toString()}`}
        from={from}
        to={to}
        isAdvancing={step > 0}
        isRightToLeft={isRightToLeft}
        gap={gap}
        seconds={secondsFor(Math.abs(spreadAt - nextAt))}
        renderPage={page}
        onDone={() => {
          setShownAt(nextAt);
        }}
      />
    );
  }

  const ordered = isRightToLeft ? [...asked].reverse() : asked;

  if (!isMoving) {
    return (
      <div
        className="flex h-full w-full items-center justify-center"
        style={{ gap: `${gap.toString()}px` }}
      >
        {ordered.map(page)}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={spreadAt}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="flex h-full w-full items-center justify-center"
          style={{ gap: `${gap.toString()}px` }}
        >
          {ordered.map(page)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

SpreadStage.displayName = 'SpreadStage';

export { SpreadStage };
