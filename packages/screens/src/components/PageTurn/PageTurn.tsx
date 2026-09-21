import { useEffect, useRef } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import type { ReactNode } from 'react';
import type { PageTurnProps } from './PageTurn.types';

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
 * The shading as the leaf turns is drawn over each face rather than as a filter on the leaf, because
 * a filter flattens the leaf and its two faces into one plane, and the face that should be turned
 * away shows through — the page seen changes at the wrong moment.
 *
 * @param from - The two pages that were showing, in reading order.
 * @param to - The two pages that arrive, in reading order.
 * @param isAdvancing - Whether the reader is going on, rather than back.
 * @param isRightToLeft - Whether the book is read right to left.
 * @param gap - The room, in pixels, between the two pages.
 * @param seconds - How long the leaf takes. Changed while it is turning, it carries on from where it
 *   has got to at the new pace, which is how somebody turning quickly makes it quicker.
 * @param renderPage - Draws one page.
 * @param onDone - Called once the leaf has landed.
 */
const PageTurn = ({
  from,
  to,
  isAdvancing,
  isRightToLeft,
  gap,
  seconds,
  renderPage,
  onDone,
}: PageTurnProps) => {
  const earlier = isAdvancing ? from : to;
  const later = isAdvancing ? to : from;
  const swing = isRightToLeft ? 180 : -180;
  const half = `${(gap / 2).toString()}px`;
  const rotate = useMotionValue(isAdvancing ? 0 : swing);
  const shade = useTransform(rotate, (angle) => 0.45 * Math.sin((Math.PI * Math.abs(angle)) / 180));
  const finished = useRef(onDone);

  useEffect(() => {
    finished.current = onDone;
  });

  useEffect(() => {
    const turning = animate(rotate, isAdvancing ? swing : 0, {
      duration: seconds,
      ease: 'easeInOut',
      onComplete: () => {
        finished.current();
      },
    });

    return () => {
      turning.stop();
    };
  }, [rotate, isAdvancing, swing, seconds]);

  const [earlierFirst, earlierSecond] = earlier;
  const [laterFirst, laterSecond] = later;
  const onLeft = isRightToLeft ? laterSecond : earlierFirst;
  const onRight = isRightToLeft ? earlierFirst : laterSecond;

  const face = (page: number | undefined, isBack: boolean): ReactNode => (
    <div
      className={`absolute inset-0 flex items-center ${isBack === isRightToLeft ? 'justify-start' : 'justify-end'}`}
      style={{
        backfaceVisibility: 'hidden',
        padding: `0 ${half}`,
        ...(isBack ? { transform: 'rotateY(180deg)' } : {}),
      }}
    >
      {page === undefined ? null : renderPage(page)}
      <motion.div
        aria-hidden
        style={{ opacity: shade }}
        className="pointer-events-none absolute inset-0 bg-shade"
      />
    </div>
  );

  return (
    <div className="relative flex h-full w-full" style={{ perspective: '2400px' }}>
      <div className="flex w-1/2 items-center justify-end" style={{ padding: `0 ${half}` }}>
        {onLeft === undefined ? null : renderPage(onLeft)}
      </div>

      <div className="flex w-1/2 items-center justify-start" style={{ padding: `0 ${half}` }}>
        {onRight === undefined ? null : renderPage(onRight)}
      </div>

      <motion.div
        className={`absolute inset-y-0 z-10 flex w-1/2 ${isRightToLeft ? 'left-0' : 'right-0'}`}
        style={{
          rotateY: rotate,
          transformStyle: 'preserve-3d',
          transformOrigin: isRightToLeft ? 'right center' : 'left center',
        }}
      >
        {face(earlierSecond, false)}
        {face(laterFirst, true)}
      </motion.div>
    </div>
  );
};

PageTurn.displayName = 'PageTurn';

export { PageTurn };
