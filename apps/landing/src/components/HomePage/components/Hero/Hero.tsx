import { useState } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import {
  letterArrival,
  popArrival,
  revealTransition,
  revealVariants,
  staggerVariants,
} from '@ValenceUI/animations/reveal';
import { IconBrandWindowsFilled } from '@tabler/icons-react';
import { SplitButton } from '@ValenceUI/SplitButton';
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

const BEFORE = ['Your', 'films', 'and', 'programmes,', 'on'];

const ACCENT = 'every screen';

const AFTER = ['in', 'the', 'house'];

const HEADLINE = 'Your films and programmes, on every screen in the house.';

const HEADLINE_LEAD = 0.2;

const WORD_STEP = 0.05;

const BUTTONS_LEAD = 0.7;

const STARTS = [
  {
    id: 'install',
    label: 'Get started',
    detail: 'Run it on your own server',
    go: (isStill: boolean) => {
      document
        .getElementById('download')
        ?.scrollIntoView({ behavior: isStill ? 'auto' : 'smooth' });
    },
  },
  {
    id: 'docs',
    label: 'Read the docs',
    detail: 'The quick start, step by step',
    go: () => {
      window.location.assign(`${DOCS_URL}/start/quick-start`);
    },
  },
  {
    id: 'demo',
    label: 'Try the demo',
    detail: 'A server already running, to look round',
    go: () => {
      window.location.assign(DEMO_URL);
    },
  },
] as const;

/**
 * The first thing anybody sees: a dark card washed with slow blue light, what Valence is in one
 * line with the words that matter most written softer and underlined by hand, one way to start, and
 * beneath it the app itself, tipped back on the table, which lays itself flat as the page scrolls —
 * hanging over the foot of the card, with a band of Valence's name running behind its middle.
 *
 * The heading is lit from below, grey rising to white inside a white edge, and writes itself in
 * a word at a time, the line draws itself under its words once the heading has landed, and the
 * way to start pops up after it with a note pointing at it, above the marks of what it runs on. The way to start is the download unless the docs or the demo are chosen
 * from its arrow, and pressing it does whichever is chosen.
 */
const Hero = () => {
  const prefersReducedMotion = useReducedMotionConfig();
  const isStill = prefersReducedMotion === true;
  const words = [...BEFORE, ACCENT, ...AFTER];
  const [startId, setStartId] = useState<string>(STARTS[0].id);
  const start = STARTS.find((one) => one.id === startId) ?? STARTS[0];

  return (
    <section className="relative px-2 pt-2 [--app-peek:min(30vw,8rem)] sm:px-3 sm:pt-3 sm:[--app-peek:max(min(14vw,9.5rem),calc(100svh-var(--release-bar)-44rem))]">
      <div className="relative isolate flex min-h-[calc(100svh-var(--release-bar)-1rem)] flex-col overflow-hidden rounded-[2rem] bg-aurora pb-[calc(var(--app-peek)+1.5rem)] sm:min-h-[calc(100svh-var(--release-bar)-1.5rem)] sm:rounded-[2.5rem]">
        <FoldGradient
          colors={[...AURORA.colours]}
          bgColor={AURORA.back}
          shadowColor={AURORA.shadow}
          softness={0.9}
          saturation={1.1}
          rotation={52}
          zoom={7}
          ribbon={0.17}
          ribbonWidth={1}
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
              'max-w-[16ch] text-balance text-[clamp(2.5rem,6vw,4.75rem)] font-semibold leading-[0.95] tracking-[-0.035em] text-on-scrim',
              LEGIBLE,
            )}
          >
            <span className="sr-only">{HEADLINE}</span>
            {words.map((word, at) => (
              <span key={`${word}-${at.toString()}`} aria-hidden>
                {at === 0 ? null : ' '}
                <motion.span
                  className={cn(
                    'inline-block bg-linear-to-b from-on-scrim/50 via-on-scrim/85 to-on-scrim bg-clip-text pb-[0.1em] -mb-[0.1em] text-transparent [-webkit-text-stroke:1px_var(--color-on-scrim)]',
                    word === ACCENT
                      ? 'relative font-accent font-normal italic tracking-normal'
                      : '',
                  )}
                  {...letterArrival(HEADLINE_LEAD + at * WORD_STEP, isStill)}
                >
                  {word}
                  {word === ACCENT ? (
                    <Doodle
                      of="underline"
                      delay={HEADLINE_LEAD + words.length * WORD_STEP + 0.2}
                      className="absolute -bottom-[0.12em] left-[2%] h-[0.22em] w-[96%] text-accent"
                    />
                  ) : null}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            variants={revealVariants(prefersReducedMotion)}
            transition={revealTransition(prefersReducedMotion, 'bouncy')}
            className={cn('max-w-2xl text-balance text-lg text-on-scrim/75 sm:text-xl', LEGIBLE)}
          >
            A streaming platform you run on your own server, for films, programmes, music and books.{' '}
            <strong className="font-semibold text-on-scrim">
              We do not run servers for users.
            </strong>
          </motion.p>

          <div className="relative flex flex-wrap items-center justify-center gap-3 pt-12">
            <motion.span className="flex" {...popArrival(BUTTONS_LEAD, isStill)}>
              <SplitButton
                tone="confirm"
                size="lg"
                choiceLabel="Other ways to start"
                choiceName="Start by"
                options={STARTS.map(({ id, label, detail }) => ({ id, label, detail }))}
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
            </motion.span>

            <span
              aria-hidden
              className="pointer-events-none absolute bottom-1/2 right-full hidden translate-y-7 pr-2 lg:block"
            >
              <motion.span
                className="block -rotate-3 whitespace-nowrap pr-6 text-right font-hand text-2xl leading-none text-on-scrim/85"
                {...popArrival(BUTTONS_LEAD + 0.4, isStill)}
              >
                free, and always will be
              </motion.span>
              <Doodle
                of="arrowCurl"
                delay={BUTTONS_LEAD + 0.8}
                className="ml-auto mt-1 h-8 w-20 text-on-scrim/70"
              />
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
      </div>

      <div className="relative z-10 -mt-[var(--app-peek)] px-4 sm:px-10">
        <ValenceBand className="absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2" />
        <DeviceStage />
      </div>
    </section>
  );
};

Hero.displayName = 'Hero';

export { Hero };
