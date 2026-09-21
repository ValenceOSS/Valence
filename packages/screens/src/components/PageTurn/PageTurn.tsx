import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import type { PageTurnProps } from './PageTurn.types';

const TURN_SECONDS = 0.6;

const LIT = 'brightness(1)';

const SHADED = 'brightness(0.6)';

/**
 * The turning of a page in a book open at two, done as a book does it: one leaf, hinged along the
 * middle where the two pages meet, lifting from the outer edge of its side and swinging over the
 * hinge to lie on the other. Its front is the page it was, its back the page that arrives on the
 * other side, and under it the pages on each side stay where they are — the one it uncovers is the
 * page that arrives on its own side, and the one it lands on is the page that is left.
 *
 * Which side the leaf is on follows the reading: on the right for a book read left to right, and
 * swinging left; on the left for one read right to left, swinging right. Going back is the same leaf
 * swung back the other way.
 *
 * @param from - The two pages that were showing, in reading order.
 * @param to - The two pages that arrive, in reading order.
 * @param isAdvancing - Whether the reader is going on, rather than back.
 * @param isRightToLeft - Whether the book is read right to left.
 * @param gap - The room, in pixels, between the two pages.
 * @param renderPage - Draws one page.
 * @param onDone - Called once the leaf has landed.
 */
const PageTurn = ({
  from,
  to,
  isAdvancing,
  isRightToLeft,
  gap,
  renderPage,
  onDone,
}: PageTurnProps) => {
  const earlier = isAdvancing ? from : to;
  const later = isAdvancing ? to : from;
  const swing = isRightToLeft ? 180 : -180;
  const half = `${(gap / 2).toString()}px`;

  const leaf = (front: number | undefined, back: number | undefined): ReactNode => (
    <motion.div
      initial={{ rotateY: isAdvancing ? 0 : swing }}
      animate={{
        rotateY: isAdvancing ? swing : 0,
        filter: [LIT, SHADED, LIT],
      }}
      transition={{ duration: TURN_SECONDS, ease: 'easeInOut' }}
      onAnimationComplete={onDone}
      className={`absolute inset-y-0 z-10 flex w-1/2 ${isRightToLeft ? 'left-0' : 'right-0'}`}
      style={{
        transformStyle: 'preserve-3d',
        transformOrigin: isRightToLeft ? 'right center' : 'left center',
      }}
    >
      <div
        className={`absolute inset-0 flex items-center ${isRightToLeft ? 'justify-end' : 'justify-start'}`}
        style={{
          backfaceVisibility: 'hidden',
          padding: `0 ${half}`,
        }}
      >
        {front === undefined ? null : renderPage(front)}
      </div>

      <div
        className={`absolute inset-0 flex items-center ${isRightToLeft ? 'justify-start' : 'justify-end'}`}
        style={{
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          padding: `0 ${half}`,
        }}
      >
        {back === undefined ? null : renderPage(back)}
      </div>
    </motion.div>
  );

  const [earlierFirst, earlierSecond] = earlier;
  const [laterFirst, laterSecond] = later;
  const onLeft = isRightToLeft ? laterSecond : earlierFirst;
  const onRight = isRightToLeft ? earlierFirst : laterSecond;

  return (
    <div className="relative flex h-full w-full" style={{ perspective: '2400px' }}>
      <div className="flex w-1/2 items-center justify-end" style={{ padding: `0 ${half}` }}>
        {onLeft === undefined ? null : renderPage(onLeft)}
      </div>

      <div className="flex w-1/2 items-center justify-start" style={{ padding: `0 ${half}` }}>
        {onRight === undefined ? null : renderPage(onRight)}
      </div>

      {leaf(earlierSecond, laterFirst)}
    </div>
  );
};

PageTurn.displayName = 'PageTurn';

export { PageTurn };
