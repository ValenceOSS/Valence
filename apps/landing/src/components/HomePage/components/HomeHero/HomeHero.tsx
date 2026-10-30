import { Link } from '@tanstack/react-router';
import { motion, useReducedMotionConfig } from 'motion/react';
import { ArrowRight as ArrowRightIcon } from '@keyline-icons/react';
import { revealTransition, revealVariants, staggerVariants } from '@ValenceUI/animations/reveal';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { CHANGELOG } from '@ValenceLanding/content/changelog/CHANGELOG';
import { DEMO_URL } from '@ValenceLanding/content/DEMO_URL';
import { webpSourcesOf } from '@ValenceLanding/webpSourcesOf';

const NEWEST = CHANGELOG[0];

const SCREENSHOT = '/devices/web.jpg';

/**
 * The top of the home page: what Valence is in one large line, a quieter line under it beside a
 * link to the newest release, a way to start and a way to look round the demo, and the web app
 * itself held in a window over a soft light.
 */
const HomeHero = () => {
  const prefersReducedMotion = useReducedMotionConfig();
  const isStill = prefersReducedMotion === true;
  const rise = revealVariants(prefersReducedMotion);
  const settle = revealTransition(prefersReducedMotion, 'heavy');

  return (
    <motion.section
      aria-label="Valence"
      variants={staggerVariants}
      initial="hidden"
      animate="shown"
      className="pt-20 sm:pt-36 lg:pt-44"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-10">
        <motion.h1
          variants={rise}
          transition={settle}
          className="max-w-[18ch] text-balance text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-text"
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

        <motion.div variants={rise} transition={settle} className="mt-8 flex flex-wrap gap-3">
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
        </motion.div>
      </div>

      <motion.div
        variants={rise}
        transition={settle}
        className="relative mt-16 px-2 pb-16 sm:mt-20 sm:px-3 sm:pb-24"
      >
        <span
          aria-hidden
          className="absolute inset-x-2 bottom-0 top-1/3 rounded-b-[2rem] bg-[radial-gradient(ellipse_55%_70%_at_50%_100%,color-mix(in_oklab,var(--color-text)_16%,transparent),transparent)] sm:inset-x-3"
        />
        <div className="relative mx-auto max-w-[84rem] px-3 sm:px-7">
          <div className="rounded-[0.9rem] border border-[var(--surface-line)] bg-[var(--frame-panel)] p-1.5 shadow-[var(--shadow-cast)] sm:rounded-[1.4rem] sm:p-2.5">
            <img
              src={SCREENSHOT}
              srcSet={webpSourcesOf(SCREENSHOT, [800, 1600, 2400])}
              sizes="(min-width: 84rem) 82rem, 100vw"
              width={2400}
              height={1350}
              alt="The Valence web app's home page, with a film in the featured row"
              loading="eager"
              draggable={false}
              className="block w-full select-none rounded-[0.55rem] border border-[var(--surface-line)] sm:rounded-[0.9rem]"
            />
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
};

HomeHero.displayName = 'HomeHero';

export { HomeHero };
