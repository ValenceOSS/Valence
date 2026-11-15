import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
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
import { Icon } from '@ValenceUI/Icon';
import { SplitButton } from '@ValenceUI/SplitButton';
import { CHANGELOG } from '@ValenceLanding/content/changelog/CHANGELOG';
import { DEMO_URL } from '@ValenceLanding/content/DEMO_URL';
import { DOCS_URL } from '@ValenceLanding/content/DOCS_URL';
import { detectPlatform } from '@ValenceLanding/content/downloads/detectPlatform';
import { useIsArm } from '@ValenceLanding/content/downloads/useIsArm';
import { latestRelease } from '@ValenceLanding/content/downloads/latestRelease';
import rawReleases from 'virtual:changelog';
import { ValenceBand } from '@ValenceLanding/components/HomePage/components/ValenceBand/ValenceBand';
import { DownloadDesktop } from './components/DownloadDesktop/DownloadDesktop';
import { HeroSteps } from './components/HeroSteps/HeroSteps';
import { HeroWindow } from './components/HeroWindow/HeroWindow';
import { CyclingWord } from './components/CyclingWord/CyclingWord';
import { HeroGround } from '@ValenceLanding/components/HeroGround/HeroGround';
import { HERO_STEPS } from './HERO_STEPS';
import { useStepCycle } from '@ValenceLanding/components/HomePage/useStepCycle';

const NEWEST = CHANGELOG[0];

const HEADLINE = 'Your films, shows, music and books, on your own server.';

const KINDS = ['films', 'shows', 'music', 'books'] as const;

const KIND_STAYS_MS = 2200;

const STEP_STAYS_MS = 6000;

const LEGIBLE = 'drop-shadow-[var(--shadow-legible)]';

const NOTE_LEAD = 0.9;

const LATEST = latestRelease(rawReleases);

const STARTS = [
  {
    id: 'install',
    label: 'Get started',
    go: (isStill: boolean) => {
      document
        .getElementById('download')
        ?.scrollIntoView({ behavior: isStill ? 'auto' : 'smooth' });
    },
  },
  {
    id: 'docs',
    label: 'Read the docs',
    go: () => {
      window.location.assign(`${DOCS_URL}/start/quick-start`);
    },
  },
  {
    id: 'demo',
    label: 'Try the demo',
    go: () => {
      window.location.assign(DEMO_URL);
    },
  },
] as const;

/**
 * The top of the home page: a dark card washed with blue light written out in characters, and on
 * it what Valence is in one large line, a quieter line under it beside a link to the newest
 * release, a way to start, the desktop app for this computer and every feature, with a note pointing
 * at them, then the
 * web app itself in a window hanging over the card's foot with a short story in three steps under
 * it, each putting a different part of the app in the window in turn, and Valence's band running
 * beneath. The steps move on by themselves, round and round, unless the pointer is over the window,
 * the keyboard is on a step, or whoever is reading asked for stillness.
 */
const HomeHero = () => {
  const prefersReducedMotion = useReducedMotionConfig();
  const isStill = prefersReducedMotion === true;
  const rise = revealVariants(prefersReducedMotion);
  const settle = revealTransition(prefersReducedMotion, 'heavy');
  const [startId, setStartId] = useState<string>(STARTS[0].id);
  const [platform] = useState(() => detectPlatform(navigator));
  const isArm = useIsArm();
  const navigate = useNavigate();
  const start = STARTS.find((one) => one.id === startId) ?? STARTS[0];
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
      <div className="relative isolate overflow-hidden rounded-[2rem] pb-[calc(var(--app-peek)+2.5rem)] sm:rounded-[2.5rem] sm:pb-[calc(var(--app-peek)+3.5rem)]">
        <HeroGround />

        <div className="mx-auto w-full max-w-[87rem] px-5 pt-12 sm:px-10 sm:pt-20 lg:pt-24">
          <motion.p
            variants={rise}
            transition={settle}
            className={cn(
              'text-xs font-bold uppercase tracking-[0.22em] text-on-scrim/75',
              LEGIBLE,
            )}
          >
            Meet Valence
          </motion.p>

          <motion.h1
            variants={rise}
            transition={settle}
            className={cn(
              'mt-5 max-w-[19ch] text-balance text-[clamp(2.5rem,5vw,4.75rem)] font-[800] leading-[1.02] tracking-[-0.04em] text-on-scrim',
              LEGIBLE,
            )}
          >
            <span className="sr-only">{HEADLINE}</span>
            <span aria-hidden>
              Your <CyclingWord words={KINDS} staysMs={KIND_STAYS_MS} isStill={isStill} />
              <br />
              on your own server.
            </span>
          </motion.h1>

          <motion.div
            variants={rise}
            transition={settle}
            className="mt-6 flex flex-col gap-4 sm:mt-8 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
          >
            <p className={cn('text-pretty text-base text-on-scrim/75 sm:text-lg', LEGIBLE)}>
              A self-hosted streaming platform for the whole house. Free, with no subscription.
            </p>
          </motion.div>

          <motion.div
            variants={rise}
            transition={settle}
            className="relative mt-8 flex flex-wrap items-center gap-3"
          >
            <SplitButton
              tone="confirm"
              shape="parted"
              size="lg"
              choiceLabel="Other ways to start"
              choiceName="Start by"
              options={STARTS.map(({ id, label }) => ({ id, label }))}
              selectedId={start.id}
              onSelect={(id) => {
                setStartId(id);
              }}
              onClick={() => {
                start.go(isStill);
              }}
            >
              {start.label}
            </SplitButton>
            <DownloadDesktop release={LATEST} platform={platform} isArm={isArm} />
            <Button
              variant="raised"
              size="none"
              className="h-11 gap-2 rounded-[0.75rem] px-4 text-[0.9375rem] font-semibold"
              onClick={() => {
                void navigate({ to: '/features' });
              }}
            >
              See every feature
              <Icon of={ArrowRightIcon} size={16} />
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

            {NEWEST === undefined ? null : (
              <Link
                to="/changelog/$slug"
                params={{ slug: NEWEST.slug }}
                className={cn(
                  'group ms-auto hidden shrink-0 items-center gap-2 text-sm text-on-scrim/75 transition-colors hover:text-on-scrim sm:inline-flex sm:text-base',
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
        </div>
      </div>

      <motion.div
        variants={rise}
        transition={settle}
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
        <div
          onPointerEnter={(event) => {
            if (event.pointerType === 'mouse') {
              setIsHovered(true);
            }
          }}
          onPointerLeave={() => {
            setIsHovered(false);
          }}
        >
          <HeroWindow shots={HERO_STEPS} active={active} isStill={isStill} />
        </div>
        <HeroSteps
          steps={HERO_STEPS}
          active={active}
          progress={progress}
          isStill={isStill}
          onSelect={select}
          className="mt-4 sm:mt-6"
        />
      </motion.div>

      <ValenceBand className="mt-16 sm:mt-20" />
    </motion.section>
  );
};

HomeHero.displayName = 'HomeHero';

export { HomeHero };
