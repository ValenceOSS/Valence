import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { motion, useReducedMotionConfig } from 'motion/react';
import { ArrowRight as ArrowRightIcon } from '@keyline-icons/react';
import {
  popArrival,
  revealTransition,
  revealVariants,
  staggerVariants,
} from '@ValenceUI/animations/reveal';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { Doodle } from '@ValenceUI/Doodle';
import { GradientAscii } from '@ValenceUI/GradientAscii';
import { Icon } from '@ValenceUI/Icon';
import { LIT_TEXT } from '@ValenceUI/tokens/LIT_TEXT';
import { CHANGELOG } from '@ValenceLanding/content/changelog/CHANGELOG';
import { DEMO_URL } from '@ValenceLanding/content/DEMO_URL';
import { ValenceBand } from '@ValenceLanding/components/HomePage/components/ValenceBand/ValenceBand';
import { HeroSteps } from './components/HeroSteps/HeroSteps';
import { HeroWindow } from './components/HeroWindow/HeroWindow';
import { HERO_STEPS } from './HERO_STEPS';
import { useStepCycle } from './useStepCycle';

const NEWEST = CHANGELOG[0];

const HEADLINE = 'Your films, shows, music and books, on your own server.';

const STEP_STAYS_MS = 6000;

const LEGIBLE = 'drop-shadow-[var(--shadow-legible)]';

const NOTE_LEAD = 0.9;

/**
 * The top of the home page: a dark card washed with blue light written out in characters, and on
 * it what Valence is in one large line, a quieter line under it beside a link to the newest
 * release, a way to start and a way to look round the demo with a note pointing at them, then the
 * web app itself in a window hanging over the card's foot with a short story in three steps under
 * it, each putting a different part of the app in the window in turn, and Valence's band running
 * beneath. The steps move on by themselves, round and round, unless the pointer is over the window
 * or the steps, the keyboard is on a step, or whoever is reading asked for stillness.
 */
const HomeHero = () => {
  const prefersReducedMotion = useReducedMotionConfig();
  const isStill = prefersReducedMotion === true;
  const rise = revealVariants(prefersReducedMotion);
  const settle = revealTransition(prefersReducedMotion, 'heavy');
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { active, progress, select } = useStepCycle(
    HERO_STEPS.length,
    STEP_STAYS_MS,
    !isStill && !isHovered && !isFocused,
  );

  return (
    <motion.section
      aria-label="Valence"
      variants={staggerVariants}
      initial="hidden"
      animate="shown"
      className="relative px-2 pt-2 [--app-peek:min(30vw,8rem)] sm:px-3 sm:pt-3 sm:[--app-peek:min(24rem,18vw)]"
    >
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-aurora pb-[calc(var(--app-peek)+2.5rem)] sm:rounded-[2.5rem] sm:pb-[calc(var(--app-peek)+3.5rem)]">
        <GradientAscii
          gradientOpacity={0.5}
          glyphOpacity={0.6}
          glow={0.12}
          className="absolute inset-0 -z-10"
        />

        <div className="mx-auto w-full max-w-7xl px-5 pt-12 sm:px-10 sm:pt-20 lg:pt-24">
          <motion.p
            variants={rise}
            transition={settle}
            className={cn('font-mono text-xs uppercase tracking-[0.2em] text-on-scrim/75', LEGIBLE)}
          >
            Self-hosted &middot; Open source &middot; Yours
          </motion.p>

          <motion.h1
            variants={rise}
            transition={settle}
            className={cn(
              'mt-5 max-w-[21ch] text-balance text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[1.04] tracking-[-0.025em] text-on-scrim',
              LEGIBLE,
            )}
          >
            <span className="sr-only">{HEADLINE}</span>
            {HEADLINE.split(' ').map((word, at) => (
              <span key={`${word}-${at.toString()}`} aria-hidden>
                {at === 0 ? null : ' '}
                <span className={cn('inline-block', LIT_TEXT)}>{word}</span>
              </span>
            ))}
          </motion.h1>

          <motion.div
            variants={rise}
            transition={settle}
            className="mt-6 flex flex-col gap-4 sm:mt-8 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
          >
            <p className={cn('text-pretty text-base text-on-scrim/75 sm:text-lg', LEGIBLE)}>
              A self-hosted streaming platform for the whole house. Free, open source, and yours.
            </p>

            {NEWEST === undefined ? null : (
              <Link
                to="/changelog/$slug"
                params={{ slug: NEWEST.slug }}
                className={cn(
                  'group inline-flex shrink-0 items-center gap-2 self-start text-sm text-on-scrim/75 transition-colors hover:text-on-scrim sm:self-auto sm:text-base',
                  LEGIBLE,
                )}
              >
                <span className="font-medium text-on-scrim">New</span>
                <span>{NEWEST.version}</span>
                <Icon
                  of={ArrowRightIcon}
                  size={15}
                  className="transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5"
                />
              </Link>
            )}
          </motion.div>

          <motion.div
            variants={rise}
            transition={settle}
            className="relative mt-8 flex flex-wrap items-center gap-3"
          >
            <Button
              variant="confirm"
              size="lg"
              isPill
              onClick={() => {
                document
                  .getElementById('download')
                  ?.scrollIntoView({ behavior: isStill ? 'auto' : 'smooth' });
              }}
            >
              Get started
            </Button>
            <Button
              variant="overlay"
              size="lg"
              isPill
              onClick={() => {
                window.location.assign(DEMO_URL);
              }}
            >
              Try the demo
            </Button>

            <span
              aria-hidden
              className={cn('pointer-events-none ml-3 hidden items-end gap-1 lg:flex', LEGIBLE)}
            >
              <Doodle
                of="arrowCurl"
                delay={NOTE_LEAD + 0.4}
                className="h-8 w-20 -translate-y-2 -scale-x-100 text-on-scrim/70"
              />
              <motion.span
                className="block -rotate-3 whitespace-nowrap font-hand text-2xl leading-none text-on-scrim/85"
                {...popArrival(NOTE_LEAD, isStill)}
              >
                open sourced, and always will be
              </motion.span>
            </span>
          </motion.div>
        </div>
      </div>

      <motion.div
        variants={rise}
        transition={settle}
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') {
            setIsHovered(true);
          }
        }}
        onPointerLeave={() => {
          setIsHovered(false);
        }}
        onFocus={(event) => {
          if (event.target.matches(':focus-visible')) {
            setIsFocused(true);
          }
        }}
        onBlur={(event) => {
          if (
            !(
              event.relatedTarget instanceof Node &&
              event.currentTarget.contains(event.relatedTarget)
            )
          ) {
            setIsFocused(false);
          }
        }}
        className="relative z-10 mx-auto -mt-[var(--app-peek)] max-w-[87rem] px-3 sm:px-10"
      >
        <HeroWindow shots={HERO_STEPS} active={active} isStill={isStill} />
        <HeroSteps
          steps={HERO_STEPS}
          active={active}
          progress={progress}
          isStill={isStill}
          onSelect={select}
          className="mt-6 px-1 sm:mt-8 sm:px-2"
        />
      </motion.div>

      <ValenceBand className="mt-10 sm:mt-12" />
    </motion.section>
  );
};

HomeHero.displayName = 'HomeHero';

export { HomeHero };
