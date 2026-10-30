import { useRef } from 'react';
import type { PointerEvent } from 'react';
import { motion, useReducedMotionConfig, useSpring, useTransform } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import { useReached } from '@ValenceUI/useReached';
import { FigurePiece } from './components/FigurePiece/FigurePiece';
import { FIGURE_LAYERS } from './FIGURE_LAYERS';
import type { FigureProps } from './Figure.types';

const SWEEP = 'linear-gradient(105deg, black var(--drawn), transparent calc(var(--drawn) + 12%))';

const DRAWS_FOR_SECONDS = 1.4;

const SPREAD_SPRING = { stiffness: 70, damping: 16, mass: 1.2 };

const LEAN_SPRING = { stiffness: 110, damping: 22, mass: 1 };

const TILT_DEGREES = 5;

/**
 * An isometric line drawing of how part of Valence works, painted through masks in the colour of
 * the text around it, that sweeps in as it is scrolled to and breathes open under the pointer or a
 * tap, its parts drifting apart and the whole tilting gently towards the cursor, and that someone
 * who has asked for less motion sees whole and still.
 *
 * @param of - Which drawing.
 * @param label - What it shows, for a screen reader, where it says something the words beside it do
 *   not; without one it is left out of the reading order.
 * @param className - Its size and place, which the caller decides.
 */
const Figure = ({ of, label, className }: FigureProps) => {
  const held = useRef<HTMLSpanElement>(null);
  const isOpenByTap = useRef(false);
  const isSeen = useReached(held, { amount: 0.4 });
  const isStill = useReducedMotionConfig() === true;
  const drawing = FIGURE_LAYERS[of];
  const spread = useSpring(0, SPREAD_SPRING);
  const leanX = useSpring(0, LEAN_SPRING);
  const leanY = useSpring(0, LEAN_SPRING);
  const rotateY = useTransform(leanX, (lean) => lean * TILT_DEGREES);
  const rotateX = useTransform(leanY, (lean) => -lean * TILT_DEGREES);

  const lean = (event: PointerEvent<HTMLSpanElement>) => {
    const box = event.currentTarget.getBoundingClientRect();

    if (box.width === 0 || box.height === 0) {
      return;
    }

    leanX.set(Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width) * 2 - 1)));
    leanY.set(Math.max(-1, Math.min(1, ((event.clientY - box.top) / box.height) * 2 - 1)));
  };

  const settle = () => {
    spread.set(0);
    leanX.set(0);
    leanY.set(0);
  };

  const handlers = isStill
    ? {}
    : {
        onPointerEnter: (event: PointerEvent<HTMLSpanElement>) => {
          if (event.pointerType !== 'touch') {
            spread.set(1);
            lean(event);
          }
        },
        onPointerMove: (event: PointerEvent<HTMLSpanElement>) => {
          if (event.pointerType !== 'touch') {
            lean(event);
          }
        },
        onPointerLeave: (event: PointerEvent<HTMLSpanElement>) => {
          if (event.pointerType !== 'touch') {
            settle();
          }
        },
        onPointerUp: (event: PointerEvent<HTMLSpanElement>) => {
          if (event.pointerType === 'touch') {
            isOpenByTap.current = !isOpenByTap.current;
            spread.set(isOpenByTap.current ? 1 : 0);
          }
        },
      };

  return (
    <span
      ref={held}
      {...(label === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
      {...handlers}
      className={cn(
        '@container relative block',
        isStill ? 'pointer-events-none' : '',
        drawing.shape,
        className,
      )}
    >
      <motion.span
        className="pointer-events-none absolute inset-0"
        initial={{ '--drawn': isStill ? '112%' : '-12%' }}
        animate={{ '--drawn': isStill || isSeen ? '112%' : '-12%' }}
        transition={{ duration: isStill ? 0 : DRAWS_FOR_SECONDS, ease: [0.65, 0, 0.35, 1] }}
        style={{
          rotateX,
          rotateY,
          transformPerspective: 900,
          maskImage: SWEEP,
          WebkitMaskImage: SWEEP,
        }}
      >
        {drawing.pieces.map((piece) => (
          <FigurePiece key={piece.lines} piece={piece} drawing={drawing} spread={spread} />
        ))}
      </motion.span>
    </span>
  );
};

Figure.displayName = 'Figure';

export { Figure };
