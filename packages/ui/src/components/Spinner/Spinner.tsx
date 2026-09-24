import { Icon } from '@ValenceUI/Icon';
import { Loader as LoaderIcon } from '@keyline-icons/react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import { spinVariants, spinTransition, reducedSpinTransition } from '@ValenceUI/animations/spin';
import type { SpinnerProps, SpinnerSize } from './Spinner.types';

const SIZE_PIXELS: Record<SpinnerSize, number> = {
  xs: 12,
  sm: 16,
  md: 24,
  lg: 32,
};

/**
 * Shows that something is happening without claiming to know how far along it is. The label is
 * required rather than optional: a spinner is invisible to anybody not looking at the screen, and
 * this is the only thing that says what is being waited for.
 *
 * @param size - How large to draw it, from inside a badge to the middle of a page.
 * @param label - What is being waited for, read out and shown to anybody hovering.
 * @param isCentered - Whether it stands in the middle of the space it was given, for a spinner that is
 *   all an area shows while it loads. Left to sit where it falls, it lands in the top corner of a panel
 *   that is otherwise empty, which reads as a fault rather than as something arriving.
 * @param className - Extra classes for the caller's own layout.
 */
const Spinner = ({ size = 'md', label, isCentered = false, className }: SpinnerProps) => {
  const prefersReducedMotion = useReducedMotionConfig();

  const spinner = (
    <motion.span
      role="status"
      aria-label={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center self-center leading-none text-current',
        className,
      )}
      variants={spinVariants}
      initial="idle"
      animate={prefersReducedMotion === true ? 'idle' : 'spinning'}
      transition={prefersReducedMotion === true ? reducedSpinTransition : spinTransition}
    >
      <Icon of={LoaderIcon} size={SIZE_PIXELS[size]} />
    </motion.span>
  );

  return isCentered ? (
    <div className="flex h-full min-h-16 w-full items-center justify-center p-6">{spinner}</div>
  ) : (
    spinner
  );
};

Spinner.displayName = 'Spinner';

export { Spinner };
