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
import { Doodle } from '@ValenceUI/Doodle';
import { Icon } from '@ValenceUI/Icon';
import { CHANGELOG } from '@ValenceLanding/content/changelog/CHANGELOG';
import { DEMO_URL } from '@ValenceLanding/content/DEMO_URL';
import { ValenceBand } from '@ValenceLanding/components/HomePage/components/ValenceBand/ValenceBand';
import { HeroSteps } from './components/HeroSteps/HeroSteps';
import { TvScene } from './components/TvScene/TvScene';
import { HERO_STEPS } from './HERO_STEPS';
import { useStepCycle } from './useStepCycle';

const NEWEST = CHANGELOG[0];

const STEP_STAYS_MS = 6000;

const NOTE_LEAD = 0.9;

/**
 * The top of the home page: what Valence is in one large line, a quieter line under it beside a
 * link to the newest release, a way to start and a way to look round the demo with a note pointing
 * at them, then a living room at night with Valence on its television and a short story told in
 * three steps along its foot, each putting a different part of the app on screen in turn, and
 * Valence's band running beneath. The steps move on by themselves unless the pointer or the
 * keyboard is in the hero, or whoever is reading asked for stillness.
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
            event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)
          )
        ) {
          setIsFocused(false);
        }
      }}
      className="px-2 pt-16 sm:px-3 sm:pt-24 lg:pt-28"
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-7">
        <motion.p
          variants={rise}
          transition={settle}
          className="font-mono text-xs uppercase tracking-[0.2em] text-text-muted"
        >
          Self-hosted &middot; Open source &middot; Yours
        </motion.p>

        <motion.h1
          variants={rise}
          transition={settle}
          className="mt-5 max-w-[21ch] text-balance text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[1.04] tracking-[-0.025em] text-text"
        >
          Your films, shows, music and books, on your own server.
        </motion.h1>

        <motion.div
          variants={rise}
          transition={settle}
          className="mt-6 flex flex-col gap-4 sm:mt-8 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
        >
          <p className="text-pretty text-base text-text-muted sm:text-lg">
            A self-hosted streaming platform for the whole house. Free, open source, and yours.
          </p>

          {NEWEST === undefined ? null : (
            <Link
              to="/changelog/$slug"
              params={{ slug: NEWEST.slug }}
              className="group inline-flex shrink-0 items-center gap-2 self-start text-sm text-text-muted transition-colors hover:text-text sm:self-auto sm:text-base"
            >
              <span className="font-medium text-text">New</span>
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
            variant="inverse"
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
            variant="secondary"
            size="lg"
            isPill
            onClick={() => {
              window.location.assign(DEMO_URL);
            }}
          >
            Try the demo
          </Button>

          <span aria-hidden className="pointer-events-none ml-3 hidden items-end gap-1 lg:flex">
            <Doodle
              of="arrowCurl"
              delay={NOTE_LEAD + 0.4}
              className="h-8 w-20 -translate-y-2 -scale-x-100 text-text-muted"
            />
            <motion.span
              className="block -rotate-3 whitespace-nowrap font-hand text-2xl leading-none text-text-muted"
              {...popArrival(NOTE_LEAD, isStill)}
            >
              open sourced, and always will be
            </motion.span>
          </span>
        </motion.div>
      </div>

      <motion.div
        variants={rise}
        transition={settle}
        className="relative mx-auto mt-12 max-w-[88rem] sm:mt-16"
      >
        <TvScene
          slides={HERO_STEPS}
          active={active}
          className="rounded-[1.25rem] sm:rounded-[2rem]"
        />
        <HeroSteps
          steps={HERO_STEPS}
          active={active}
          progress={progress}
          isStill={isStill}
          onSelect={select}
          className="mt-6 px-3 sm:mt-8 sm:px-7 xl:absolute xl:inset-x-0 xl:bottom-0 xl:mt-0 xl:rounded-b-[2rem] xl:bg-linear-to-t xl:from-scrim xl:from-40% xl:to-transparent xl:px-14 xl:pb-12 xl:pt-28"
        />
      </motion.div>

      <ValenceBand className="mt-10 sm:mt-14" />
    </motion.section>
  );
};

HomeHero.displayName = 'HomeHero';

export { HomeHero };
