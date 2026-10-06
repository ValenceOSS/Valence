import { useRef } from 'react';
import { motion, useInView, useReducedMotionConfig } from 'motion/react';
import arrowCurl from '@ValenceDoodles/arrow-curl.svg';
import arrowDown from '@ValenceDoodles/arrow-down.svg';
import circle from '@ValenceDoodles/circle.svg';
import sparks from '@ValenceDoodles/sparks.svg';
import underline from '@ValenceDoodles/underline.svg';
import { cn } from '@ValenceUI/cn';
import type { DoodleName, DoodleProps } from './Doodle.types';

const MARKS: Readonly<Record<DoodleName, { file: string; sweep: string }>> = {
  arrowCurl: {
    file: arrowCurl,
    sweep: 'linear-gradient(to right, black var(--drawn), transparent 0)',
  },
  arrowDown: {
    file: arrowDown,
    sweep: 'linear-gradient(to bottom, black var(--drawn), transparent 0)',
  },
  circle: { file: circle, sweep: 'conic-gradient(from 20deg, black var(--drawn), transparent 0)' },
  sparks: { file: sparks, sweep: 'linear-gradient(to right, black var(--drawn), transparent 0)' },
  underline: {
    file: underline,
    sweep: 'linear-gradient(to right, black var(--drawn), transparent 0)',
  },
};

const DRAWS_FOR_SECONDS = 0.9;

/**
 * A hand-drawn mark beside the words it points at — a ring round a word, an arrow towards a note, a
 * line beneath — which draws itself in the first time it is scrolled into view, as a pen would.
 *
 * The mark is a file referenced by its address and painted through as a mask, so it takes the
 * colour of the text around it and no SVG is inlined; a second mask sweeps along it to draw it in.
 * It says nothing to a screen reader, since the words it decorates already say what it means, and
 * someone who has asked for less motion sees it drawn already.
 *
 * @param of - Which mark.
 * @param delay - How long after it comes into view it starts drawing, in seconds.
 * @param isShown - Whether it may be drawn yet, for a mark that waits on something else on the page
 *   as well as on being seen.
 * @param className - Its size and place, which the caller decides.
 */
const Doodle = ({ of, delay = 0, isShown = true, className }: DoodleProps) => {
  const held = useRef<HTMLSpanElement>(null);
  const isSeen = useInView(held, { once: true, amount: 0.6 });
  const isStill = useReducedMotionConfig() === true;
  const { file, sweep } = MARKS[of];
  const masks = `url("${file}"), ${sweep}`;

  return (
    <motion.span
      ref={held}
      aria-hidden
      className={cn('pointer-events-none block bg-current', className)}
      initial={{ '--drawn': isStill ? '100%' : '0%' }}
      animate={{ '--drawn': isStill || (isSeen && isShown) ? '100%' : '0%' }}
      transition={{ duration: isStill ? 0 : DRAWS_FOR_SECONDS, delay, ease: [0.65, 0, 0.35, 1] }}
      style={{
        maskImage: masks,
        WebkitMaskImage: masks,
        maskSize: '100% 100%',
        WebkitMaskSize: '100% 100%',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskComposite: 'intersect',
        WebkitMaskComposite: 'source-in',
      }}
    />
  );
};

Doodle.displayName = 'Doodle';

export { Doodle };
