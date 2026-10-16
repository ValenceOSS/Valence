import { useEffect, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { Info as InfoIcon } from '@keyline-icons/react';
import {
  CircleCheck as CircleCheckIcon,
  Clock as ClockIcon,
  Plus as PlusIcon,
} from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { PageDots } from '@ValenceUI/PageDots';
import { revealTransition, revealVariants, staggerVariants } from '@ValenceUI/animations/reveal';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { askingOf } from '@ValenceScreens/requests/askingOf';
import { TitleLogo } from '@ValenceScreens/components/TitleLogo/TitleLogo';
import type { DiscoverHeroProps } from './DiscoverHero.types';
import { say } from '@ValenceI18n/say';

const ROTATE_AFTER_MILLISECONDS = 9000;

const LOGO_BOX = 'max-h-[22svh] w-auto max-w-[min(76vw,36rem)] object-contain object-left';

/**
 * The top of Discover, as Home's hero is the top of the library: the titles trending this week,
 * each over its backdrop with its title logo, what it is and whether it is here or asked for, to
 * request or read more about, moving on by itself and by its dots.
 *
 * @param titles - The titles trending, the first few of which it shows.
 * @param onAsk - Told the title to open, as its address names it.
 * @param rotateAfterMilliseconds - How long each title holds the screen.
 */
const DiscoverHero = ({
  titles,
  onAsk,
  rotateAfterMilliseconds = ROTATE_AFTER_MILLISECONDS,
}: DiscoverHeroProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const [at, setAt] = useState(0);
  const [unlettered, setUnlettered] = useState<ReadonlySet<string>>(new Set());
  const described = useQueries({
    queries: titles.map((title) => requestsQueries.askable(title.kind, title.id)),
  });
  const shown = described.flatMap((one) =>
    one.data === undefined || one.data.backdropUrl === null ? [] : [one.data],
  );
  const featured = shown[at % Math.max(shown.length, 1)];

  useEffect(() => {
    if (shown.length < 2 || rotateAfterMilliseconds <= 0) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setAt((now) => now + 1);
    }, rotateAfterMilliseconds);

    return () => {
      clearTimeout(timer);
    };
  }, [at, shown.length, rotateAfterMilliseconds]);

  if (featured === undefined) {
    return null;
  }

  const { status } = featured.standing;
  const key = `${featured.kind}:${featured.id}`;
  const logo = featured.logoUrl ?? null;
  const facts = [
    featured.year?.toString() ?? null,
    featured.genres.slice(0, 2).join(', ') || null,
  ].filter((fact) => fact !== null);

  return (
    <section className="relative flex h-[min(64svh,44rem)] min-h-[26rem] flex-col justify-end overflow-hidden rounded-[20px] shadow-[var(--shadow-cast)] ring-1 ring-line">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.img
          key={key}
          alt=""
          src={featured.backdropUrl ?? ''}
          initial={{ opacity: 0, scale: prefersReducedMotion === true ? 1 : 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion === true ? 0.2 : 1.1, ease: 'easeOut' }}
          className="absolute inset-0 size-full object-cover"
        />
      </AnimatePresence>

      <div className="valence-artwork-scrim pointer-events-none absolute inset-0" />

      <motion.div
        key={key}
        variants={staggerVariants}
        initial="hidden"
        animate="shown"
        className="relative flex flex-col gap-4 self-start px-6 pb-10 pt-24 sm:px-12 sm:pb-14"
      >
        <motion.span
          variants={revealVariants(prefersReducedMotion)}
          transition={revealTransition(prefersReducedMotion)}
          className="text-sm font-medium text-on-scrim/80"
        >
          {featured.kind === 'film'
            ? say('screens.requestsPage.discoverHero.trendingFilmThisWeek')
            : say('screens.requestsPage.discoverHero.trendingSeriesThisWeek')}
        </motion.span>

        <motion.h1
          variants={revealVariants(prefersReducedMotion)}
          transition={revealTransition(prefersReducedMotion, 'heavy')}
          className={
            logo !== null && !unlettered.has(key)
              ? 'flex'
              : 'max-w-[16ch] text-[clamp(2.75rem,5.5vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.035em] text-on-scrim'
          }
        >
          {logo !== null && !unlettered.has(key) ? (
            <TitleLogo
              src={logo}
              alt={featured.title}
              className={LOGO_BOX}
              onError={() => {
                setUnlettered((known) => new Set(known).add(key));
              }}
            />
          ) : (
            featured.title
          )}
        </motion.h1>

        <motion.p
          variants={revealVariants(prefersReducedMotion)}
          transition={revealTransition(prefersReducedMotion)}
          className="flex flex-wrap items-center gap-2 text-base text-on-scrim/90"
        >
          {facts.map((fact, index) => (
            <span key={fact} className="flex items-center gap-2">
              {index === 0 ? null : <span aria-hidden>·</span>}
              {fact}
            </span>
          ))}
          {status === 'askable' ? null : (
            <span className="ml-2 flex items-center gap-1.5 rounded-full bg-overlay px-2.5 py-0.5 text-sm backdrop-blur">
              <Icon of={status === 'library' ? CircleCheckIcon : ClockIcon} size={14} />
              {status === 'library' ? say('common.inYourLibrary') : say('common.requested')}
            </span>
          )}
        </motion.p>

        {featured.overview === null ? null : (
          <motion.p
            variants={revealVariants(prefersReducedMotion)}
            transition={revealTransition(prefersReducedMotion)}
            className="line-clamp-3 max-w-[56ch] text-lg leading-relaxed text-on-scrim/90 drop-shadow-[var(--shadow-legible-tight)]"
          >
            {featured.overview}
          </motion.p>
        )}

        <motion.div
          variants={revealVariants(prefersReducedMotion)}
          transition={revealTransition(prefersReducedMotion)}
          className="flex flex-wrap items-center gap-3 pt-3"
        >
          {status === 'askable' ? (
            <Button
              variant="confirm"
              size="xl"
              onClick={() => {
                onAsk(askingOf(featured));
              }}
            >
              <Icon of={PlusIcon} size={18} />
              {say('common.request')}
            </Button>
          ) : null}
          <Button
            variant="overlay"
            size="xl"
            onClick={() => {
              onAsk(askingOf(featured));
            }}
          >
            <Icon of={InfoIcon} size={18} />
            {say('common.moreInfo')}
          </Button>
        </motion.div>
      </motion.div>

      {shown.length < 2 ? null : (
        <PageDots
          count={shown.length}
          selectedIndex={at % shown.length}
          labels={shown.map((one) => one.title)}
          label={say('screens.requestsPage.discoverHero.trendingTitles')}
          tone="overlay"
          onSelect={setAt}
          className="mb-8 mr-6 self-end sm:absolute sm:bottom-14 sm:right-12 sm:mb-0 sm:mr-0"
        />
      )}
    </section>
  );
};

DiscoverHero.displayName = 'DiscoverHero';

export { DiscoverHero };
