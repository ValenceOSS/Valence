import { useEffect, useRef } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import {
  letterArrival,
  revealTransition,
  revealVariants,
  staggerVariants,
} from '@ValenceUI/animations/reveal';
import { cn } from '@ValenceUI/cn';
import type { SetupStepFrameProps } from './SetupStepFrame.types';

const WORD_STEP = 0.035;

const WORDS_LEAD = 0.05;

/**
 * One step of first-run setup, laid out the same way each time: the step's heading, written in a
 * word at a time, what it is for, what it asks, and its way back and on along the bottom, each
 * arriving just after the one above it. The heading takes focus as the step arrives, so somebody
 * moving through setup with a screen reader hears where they have landed.
 *
 * @param title - What the step is.
 * @param lead - What it is for, in a sentence or two.
 * @param children - What it asks.
 * @param back - Its way back, set against the left edge.
 * @param actions - Its ways on, set against the right edge.
 * @param aside - Something drawn under everything else, to the full width of the column.
 * @param isWide - Whether it holds something broad, such as bringing a whole server across.
 */
const SetupStepFrame = ({
  title,
  lead,
  children,
  back,
  actions,
  aside,
  isWide = false,
}: SetupStepFrameProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const isStill = prefersReducedMotion === true;
  const heading = useRef<HTMLHeadingElement>(null);
  const part = {
    variants: revealVariants(prefersReducedMotion),
    transition: revealTransition(prefersReducedMotion),
  };

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  return (
    <motion.section
      variants={staggerVariants}
      initial="hidden"
      animate="shown"
      className={cn('flex w-full flex-col gap-9', isWide ? 'max-w-4xl' : 'max-w-2xl')}
    >
      <header className="flex flex-col gap-4">
        <h1
          ref={heading}
          tabIndex={-1}
          className="text-[clamp(2rem,4.4vw,3.25rem)] font-semibold leading-[1.04] tracking-[-0.045em] text-text outline-none"
        >
          <span className="sr-only">{title}</span>
          {title.split(' ').map((word, at) => (
            <span key={`${word}-${at.toString()}`} aria-hidden>
              {at === 0 ? null : ' '}
              <motion.span
                className="inline-block"
                {...letterArrival(WORDS_LEAD + at * WORD_STEP, isStill)}
              >
                {word}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.div {...part} className="max-w-[60ch] text-base leading-relaxed text-text-muted">
          {lead}
        </motion.div>
      </header>

      {children === undefined ? null : (
        <motion.div {...part} className="flex flex-col gap-7">
          {children}
        </motion.div>
      )}

      {back === undefined && actions === undefined ? null : (
        <motion.footer
          {...part}
          className={cn(
            'flex items-center gap-3 pt-1',
            back === undefined ? 'justify-start' : 'justify-between',
          )}
        >
          {back === undefined ? null : <span className="-ml-3 flex">{back}</span>}
          <span className="flex flex-wrap items-center justify-end gap-2">{actions}</span>
        </motion.footer>
      )}

      {aside === undefined ? null : <motion.div {...part}>{aside}</motion.div>}
    </motion.section>
  );
};

SetupStepFrame.displayName = 'SetupStepFrame';

export { SetupStepFrame };
