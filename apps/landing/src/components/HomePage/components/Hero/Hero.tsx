import { motion, useReducedMotionConfig } from 'motion/react';
import {
  letterArrival,
  popArrival,
  revealTransition,
  revealVariants,
  staggerVariants,
} from '@ValenceUI/animations/reveal';
import { IconBrandWindowsFilled } from '@tabler/icons-react';
import { Button } from '@ValenceUI/Button';
import { BrandGlyph } from '@ValenceUI/BrandGlyph';
import { Tooltip } from '@ValenceUI/Tooltip';
import { Doodle } from '@ValenceUI/Doodle';
import { cn } from '@ValenceUI/cn';
import { FoldGradient } from '@ValenceLanding/components/FoldGradient/FoldGradient';
import { AURORA } from '@ValenceLanding/tokens/AURORA';
import { DOCS_URL } from '@ValenceLanding/content/DOCS_URL';
import { DEMO_URL } from '@ValenceLanding/content/DEMO_URL';
import { DeviceStage } from './components/DeviceStage/DeviceStage';
import { ValenceBand } from './components/ValenceBand/ValenceBand';

const PLATFORMS = [
  { label: 'Docker', mark: 'docker' },
  { label: 'Apple', mark: 'apple' },
  { label: 'Android', mark: 'android' },
  { label: 'Windows', mark: null },
  { label: 'Linux', mark: 'linux' },
] as const;

const LEGIBLE = 'drop-shadow-[var(--shadow-legible)]';

const BEFORE = ['Your', 'films', 'and'];

const ACCENT = 'programmes,';

const AFTER = ['on', 'every', 'screen', 'in', 'the', 'house'];

const HEADLINE = 'Your films and programmes, on every screen in the house.';

const HEADLINE_LEAD = 0.2;

const WORD_STEP = 0.05;

const BUTTONS_LEAD = 0.7;

const BUTTON_STEP = 0.07;

/**
 * The first thing anybody sees: a dark card washed with slow blue light, what Valence is in one
 * line with its one soft word ringed by hand, where to go next, and beneath it the app itself,
 * tipped back on the table, which lays itself flat as the page scrolls — hanging over the foot of
 * the card and across a band of Valence's name running past beneath it.
 *
 * The heading writes itself in a word at a time, the ring draws itself round its word once the
 * heading has landed, and the buttons pop up after it with a note pointing at them, over the list of
 * what it runs on.
 */
const Hero = () => {
  const prefersReducedMotion = useReducedMotionConfig();
  const isStill = prefersReducedMotion === true;
  const words = [...BEFORE, ACCENT, ...AFTER];

  return (
    <section className="relative px-2 pt-2 sm:px-3 sm:pt-3">
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-aurora sm:rounded-[2.5rem]">
        <FoldGradient
          colors={[...AURORA.colours]}
          bgColor={AURORA.back}
          shadowColor={AURORA.shadow}
          rotation={38}
          zoom={7}
          className="absolute inset-0 -z-10 h-full w-full opacity-80"
          speed={isStill ? 0 : 0.6}
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,transparent_30%,var(--color-aurora)_85%)]"
        />

        <motion.div
          variants={staggerVariants}
          initial="hidden"
          animate="shown"
          className="relative flex flex-col items-center gap-5 px-5 pt-24 text-center sm:pt-28"
        >
          <motion.p
            variants={revealVariants(prefersReducedMotion)}
            transition={revealTransition(prefersReducedMotion, 'bouncy')}
            className={cn('font-mono text-xs uppercase tracking-[0.2em] text-on-scrim/75', LEGIBLE)}
          >
            Self-hosted &middot; Open source &middot; Yours
          </motion.p>

          <h1
            className={cn(
              'max-w-[16ch] text-balance text-[clamp(2.5rem,6vw,4.75rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-on-scrim',
              LEGIBLE,
            )}
          >
            <span className="sr-only">{HEADLINE}</span>
            {words.map((word, at) => (
              <span key={`${word}-${at.toString()}`} aria-hidden>
                {at === 0 ? null : ' '}
                <motion.span
                  className={cn(
                    'inline-block',
                    word === ACCENT
                      ? 'relative font-accent font-normal italic tracking-normal'
                      : '',
                  )}
                  {...letterArrival(HEADLINE_LEAD + at * WORD_STEP, isStill)}
                >
                  {word}
                  {word === ACCENT ? (
                    <Doodle
                      of="circle"
                      delay={HEADLINE_LEAD + words.length * WORD_STEP + 0.2}
                      className="absolute -inset-x-[12%] -inset-y-[18%] text-accent"
                    />
                  ) : null}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            variants={revealVariants(prefersReducedMotion)}
            transition={revealTransition(prefersReducedMotion, 'bouncy')}
            className={cn('max-w-xl text-lg text-on-scrim/75 sm:text-xl', LEGIBLE)}
          >
            A streaming platform you run on your own server, for films, programmes, music and books.{' '}
            <strong className="font-semibold text-on-scrim">
              We do not run servers for users.
            </strong>
          </motion.p>

          <div className="relative flex flex-wrap items-center justify-center gap-3 pt-2">
            <motion.span className="flex" {...popArrival(BUTTONS_LEAD, isStill)}>
              <Button
                variant="confirm"
                size="xl"
                onClick={() => {
                  document.getElementById('download')?.scrollIntoView({
                    behavior: isStill ? 'auto' : 'smooth',
                  });
                }}
              >
                Get started
              </Button>
            </motion.span>

            <motion.span className="flex" {...popArrival(BUTTONS_LEAD + BUTTON_STEP, isStill)}>
              <Button
                variant="overlay"
                size="xl"
                onClick={() => {
                  window.location.assign(`${DOCS_URL}/start/quick-start`);
                }}
              >
                Read the docs
              </Button>
            </motion.span>

            <motion.span className="flex" {...popArrival(BUTTONS_LEAD + BUTTON_STEP * 2, isStill)}>
              <Button
                variant="overlay"
                size="xl"
                onClick={() => {
                  window.location.assign(DEMO_URL);
                }}
              >
                Try the demo
              </Button>
            </motion.span>

            <span
              aria-hidden
              className="pointer-events-none absolute left-full top-1/2 hidden w-44 -translate-y-1/2 pl-3 lg:block"
            >
              <Doodle
                of="arrowCurl"
                delay={BUTTONS_LEAD + 0.5}
                className="h-8 w-20 -scale-x-100 text-on-scrim/70"
              />
              <motion.span
                className="block -rotate-6 pl-6 pt-1 font-hand text-2xl leading-none text-on-scrim/85"
                {...popArrival(BUTTONS_LEAD + 1, isStill)}
              >
                free, and always will be
              </motion.span>
            </span>
          </div>

          <motion.p
            variants={revealVariants(prefersReducedMotion)}
            transition={revealTransition(prefersReducedMotion, 'bouncy')}
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-3 text-sm text-on-scrim/60"
          >
            {PLATFORMS.map(({ label, mark }) => (
              <Tooltip key={label} label={label}>
                <span className="inline-flex text-on-scrim/80 transition-colors hover:text-on-scrim">
                  {mark === null ? (
                    <IconBrandWindowsFilled size={20} aria-label={label} role="img" />
                  ) : (
                    <BrandGlyph of={mark} size={20} label={label} />
                  )}
                </span>
              </Tooltip>
            ))}
          </motion.p>
        </motion.div>

        <div aria-hidden className="h-[min(48vw,24rem)] sm:h-[min(30vw,30rem)]" />
      </div>

      <div className="relative z-10 -mt-[calc(min(48vw,24rem)-3rem)] px-4 sm:-mt-[calc(min(30vw,30rem)-3rem)] sm:px-10">
        <DeviceStage />
      </div>

      <ValenceBand className="-mt-[4vw] xl:-mt-[3.5rem]" />
    </section>
  );
};

Hero.displayName = 'Hero';

export { Hero };
