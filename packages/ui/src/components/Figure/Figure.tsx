import { useRef } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import linkedServers from '@ValenceFigures/linked-servers.svg';
import { cn } from '@ValenceUI/cn';
import { useReached } from '@ValenceUI/useReached';
import type { FigureName, FigureProps } from './Figure.types';

const FIGURES: Readonly<Record<FigureName, { file: string; shape: string }>> = {
  linkedServers: { file: linkedServers, shape: 'aspect-[560/361]' },
};

const SWEEP = 'linear-gradient(105deg, black var(--drawn), transparent calc(var(--drawn) + 12%))';

const DRAWS_FOR_SECONDS = 1.4;

/**
 * An isometric line drawing of how part of Valence works, drawn in thin even lines that sweep in
 * from the left as it is scrolled to, and someone who has asked for less motion sees it whole.
 *
 * Like a doodle, the drawing is a file painted through as a mask, so it takes the colour of the text
 * around it in either theme and no SVG is inlined.
 *
 * @param of - Which drawing.
 * @param label - What it shows, for a screen reader, where it says something the words beside it do
 *   not; without one it is left out of the reading order.
 * @param className - Its size and place, which the caller decides.
 */
const Figure = ({ of, label, className }: FigureProps) => {
  const held = useRef<HTMLSpanElement>(null);
  const isSeen = useReached(held, { amount: 0.4 });
  const isStill = useReducedMotionConfig() === true;
  const { file, shape } = FIGURES[of];
  const masks = `url("${file}"), ${SWEEP}`;

  return (
    <motion.span
      ref={held}
      {...(label === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
      className={cn('pointer-events-none block bg-current', shape, className)}
      initial={{ '--drawn': isStill ? '112%' : '-12%' }}
      animate={{ '--drawn': isStill || isSeen ? '112%' : '-12%' }}
      transition={{ duration: isStill ? 0 : DRAWS_FOR_SECONDS, ease: [0.65, 0, 0.35, 1] }}
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

Figure.displayName = 'Figure';

export { Figure };
