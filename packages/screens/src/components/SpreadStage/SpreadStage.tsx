import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { bookPageUrl } from '@ValenceClient/books/fetchBooks';
import { PageTurn } from '@ValenceScreens/components/PageTurn/PageTurn';
import { widthFor } from '@ValenceScreens/reading/widthFor';
import type { SpreadStageProps } from './SpreadStage.types';

const FIT_CLASSES = {
  width: 'w-full object-contain',
  height: 'h-full object-contain',
  both: 'max-h-full max-w-full object-contain',
} as const;

/**
 * The page or pair of pages a reader is on, drawn, and turned to the next as a book turns.
 *
 * A pair turns to a pair as a leaf hinged along the middle, the one page swinging over to the other
 * side. Anything else — a single page, a pair that meets a single — fades to the next, because there
 * is no middle to hinge on and a leaf swung over a half that is not there only breaks. A turn that
 * arrives while another is still going does not start a second leaf over the first: the page it
 * wanted is simply there, which is what somebody flicking quickly through the book is asking for.
 * Where turning is not animated, or somebody has asked for less movement, the next is simply there.
 *
 * @param pages - The pages showing, in reading order.
 * @param spreadAt - Which spread of the chapter this is, so a turn knows which way it went.
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
  pages,
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
  const [settled, setSettled] = useState({ at: spreadAt, pages });
  const [turningTo, setTurningTo] = useState<number | null>(null);
  const isMoving = isAnimated && prefersReducedMotion !== true;
  const isArriving = settled.at !== spreadAt;
  const isPair = settled.pages.length === 2 && pages.length === 2;
  const isLeaf = isArriving && isMoving && isPair && (turningTo === null || turningTo === spreadAt);

  useEffect(() => {
    if (isLeaf) {
      setTurningTo(spreadAt);

      return;
    }

    if (isArriving) {
      setTurningTo(null);
      setSettled({ at: spreadAt, pages });
    }
  }, [isLeaf, isArriving, spreadAt, pages]);

  const ordered = isRightToLeft ? [...pages].reverse() : pages;
  const askedWidth = widthFor(across);

  const page = (number: number) => (
    <img
      key={number}
      src={bookPageUrl(bookId, chapterId, number, askedWidth)}
      alt={`Page ${(number + 1).toString()}`}
      onLoad={(event) => {
        onLoaded(number, event.currentTarget);
      }}
      className={`select-none ${FIT_CLASSES[fit]}`}
    />
  );

  if (isLeaf) {
    return (
      <PageTurn
        key={spreadAt}
        from={settled.pages}
        to={pages}
        isAdvancing={spreadAt > settled.at}
        isRightToLeft={isRightToLeft}
        gap={gap}
        renderPage={page}
        onDone={() => {
          setTurningTo(null);
          setSettled({ at: spreadAt, pages });
        }}
      />
    );
  }

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
          transition={{ duration: 0.15 }}
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
