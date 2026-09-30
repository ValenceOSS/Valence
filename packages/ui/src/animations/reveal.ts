import type { MotionProps, Transition, Variants } from 'motion/react';

const spring: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 34,
  mass: 0.9,
};

const heavySpring: Transition = {
  type: 'spring',
  stiffness: 180,
  damping: 30,
  mass: 1.1,
};

const liquidSpring: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 34,
  mass: 1,
};

const bounceSpring: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 22,
  mass: 0.8,
};

const popSpring: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 18,
};

const openSpring: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 24,
  restDelta: 0.5,
  restSpeed: 2,
};

const letterSpring: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 22,
};

const LETTER_REST = { opacity: 1, y: 0 };

const POP_REST = { opacity: 1, scale: 1, y: 0, rotate: 0 };

const settleTween: Transition = {
  duration: 0.32,
  ease: [0.2, 0, 0, 1],
};

const stillTransition: Transition = { duration: 0.18, ease: 'easeOut' };

const RISE = 18;

const riseVariants: Variants = {
  hidden: { opacity: 0, y: RISE },
  shown: { opacity: 1, y: 0 },
  gone: { opacity: 0, y: -RISE },
};

const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 },
  gone: { opacity: 0 },
};

const staggerVariants: Variants = {
  hidden: {},
  shown: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
  gone: {
    transition: { staggerChildren: 0.03, staggerDirection: -1 },
  },
};

/**
 * Picks how something should arrive: rising into place, or simply fading, for somebody who has
 * asked their system for less movement. The two are kept as separate variant sets rather than one
 * set with the distance zeroed, so a reduced-motion arrival is a deliberate design rather than a
 * broken one.
 *
 * @param prefersReducedMotion - What the system reports, which is null until it has been read.
 * @returns The variants to hand a Motion component.
 */
const revealVariants = (prefersReducedMotion: boolean | null): Variants =>
  prefersReducedMotion === true ? fadeVariants : riseVariants;

/**
 * Picks the curve something moves on. Reduced motion gets no duration at all, so the end state
 * simply is. The heavier spring is for the large things — a page, a hero — which look wrong
 * arriving as fast as a card does.
 *
 * @param prefersReducedMotion - What the system reports, which is null until it has been read.
 * @param weight - Whether this is a large thing arriving, an ordinary one, or one that should land
 *   with a little overshoot.
 * @returns The transition to hand a Motion component.
 */
const revealTransition = (
  prefersReducedMotion: boolean | null,
  weight: 'light' | 'heavy' | 'bouncy' = 'light',
): Transition => {
  if (prefersReducedMotion === true) {
    return stillTransition;
  }

  if (weight === 'bouncy') {
    return bounceSpring;
  }

  return weight === 'heavy' ? heavySpring : spring;
};

const STAGGER_STEP = 0.045;

const STAGGER_CEILING = 0.42;

const HEADING_LEAD = 0.06;

const POP = 0.92;

/**
 * Works out how long the card at a given place in a row waits before arriving, so a row assembles
 * left to right rather than appearing at once. The wait stops growing past a ceiling: a row of
 * forty would otherwise still be arriving long after somebody had started reading it.
 *
 * @param index - Where the card sits in the row, counting from zero.
 * @returns How long to wait, in seconds.
 */
const staggerDelay = (index: number): number => Math.min(index * STAGGER_STEP, STAGGER_CEILING);

const groupVariants: Variants = { hidden: {}, shown: {}, gone: {} };

/**
 * Builds the variants for one card of a row, each arriving after the one before it and leaving in
 * the same order at twice the speed. Leaving faster than arriving is deliberate: an exit that takes
 * as long as an entrance reads as the interface hesitating. Cards come in just after their row's
 * heading, rising from a little smaller on a spring that overshoots a touch, so a row lands rather
 * than fades up.
 *
 * @param prefersReducedMotion - What the system reports, which is null until it has been read.
 * @returns The variants to hand a Motion component, which take the card's index.
 */
const revealItemVariants = (prefersReducedMotion: boolean | null): Variants => ({
  hidden: prefersReducedMotion === true ? { opacity: 0 } : { opacity: 0, y: RISE, scale: POP },
  shown: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition:
      prefersReducedMotion === true
        ? { ...stillTransition, delay: staggerDelay(index) }
        : { ...bounceSpring, delay: HEADING_LEAD + staggerDelay(index) },
  }),
  gone: (index: number) => {
    return {
      opacity: 0,
      y: prefersReducedMotion === true ? 0 : -RISE,
      transition: { ...stillTransition, delay: staggerDelay(index) / 2 },
    };
  },
});

/**
 * How one letter of a name arrives: rising a little into place as it fades up, after the given wait,
 * so a word can be written in one letter at a time. It moves and fades only — a blur on every letter
 * at once is costly enough to stutter. For somebody who asked for less motion, or once
 * the arrival has been and gone, the letter is simply there.
 *
 * @param delay - How long this letter waits, in seconds.
 * @param isStill - Whether it should simply be there.
 * @returns The Motion props for the letter.
 */
const letterArrival = (
  delay: number,
  isStill: boolean,
): Pick<MotionProps, 'initial' | 'animate' | 'transition'> =>
  isStill
    ? { initial: false as const, animate: LETTER_REST }
    : {
        initial: { opacity: 0, y: 8 },
        animate: LETTER_REST,
        transition: { ...letterSpring, delay },
      };

/**
 * How something small arrives with a bounce — a tool in a bar, a button in a row: popping up from
 * small with a little turn after the given wait, overshooting a touch as it lands. For somebody who
 * asked for less motion, or something that draws its own arrival, it is simply there, and never left
 * halfway.
 *
 * @param delay - How long it waits, in seconds.
 * @param isStill - Whether it should simply be there.
 * @returns The Motion props for the thing arriving.
 */
const popArrival = (
  delay: number,
  isStill: boolean,
): Pick<MotionProps, 'initial' | 'animate' | 'transition'> =>
  isStill
    ? { initial: false as const, animate: POP_REST, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, scale: 0.4, y: 6, rotate: -18 },
        animate: POP_REST,
        transition: { ...bounceSpring, delay },
      };

export {
  spring,
  popArrival,
  popSpring,
  openSpring,
  letterArrival,
  bounceSpring,
  liquidSpring,
  settleTween,
  stillTransition,
  riseVariants,
  fadeVariants,
  staggerVariants,
  groupVariants,
  revealItemVariants,
  revealVariants,
  revealTransition,
};
