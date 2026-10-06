import { useRef } from 'react';
import { Link } from '@tanstack/react-router';
import { motion, useReducedMotionConfig } from 'motion/react';
import { ArrowRight as ArrowRightIcon } from '@keyline-icons/react';
import { groupVariants, revealItemVariants } from '@ValenceUI/animations/reveal';
import { Icon } from '@ValenceUI/Icon';
import { useReached } from '@ValenceUI/useReached';
import { cn } from '@ValenceUI/cn';
import { CHANGELOG } from '@ValenceLanding/content/changelog/CHANGELOG';
import { describeReleaseDate } from '@ValenceLanding/content/changelog/describeReleaseDate';

const SHOWN = 4;

/**
 * The newest releases on the home page, set along a line like stops on a timeline: a dot for each,
 * the newest lit, with its name, the start of what it brought and when it shipped, each leading to
 * its own page, and a way to see every release beneath them.
 */
const LatestReleases = () => {
  const prefersReducedMotion = useReducedMotionConfig();
  const releases = CHANGELOG.slice(0, SHOWN);
  const listRef = useRef<HTMLOListElement>(null);
  const isListReached = useReached(listRef, { margin: '-80px' });

  return (
    <section
      aria-label="Changelog"
      className="mx-auto flex max-w-6xl flex-col gap-14 px-5 py-24 sm:px-10 xl:max-w-7xl"
    >
      <h2 className="text-4xl font-semibold tracking-tight text-text lg:text-6xl">Changelog</h2>

      <motion.ol
        ref={listRef}
        initial="hidden"
        animate={isListReached ? 'shown' : 'hidden'}
        variants={groupVariants}
        className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8"
      >
        {releases.map((entry, at) => (
          <motion.li
            key={entry.slug}
            custom={at}
            variants={revealItemVariants(prefersReducedMotion)}
            className="flex flex-col gap-8"
          >
            <span aria-hidden className="flex items-center gap-3">
              <span
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-full',
                  at === 0 ? 'bg-accent/15' : 'bg-[var(--surface-hover)]',
                )}
              >
                <span
                  className={cn('size-2 rounded-full', at === 0 ? 'bg-accent' : 'bg-text-muted')}
                />
              </span>
              <span className="h-px flex-1 bg-linear-to-r from-border to-border/0" />
            </span>

            <Link
              to="/changelog/$slug"
              params={{ slug: entry.slug }}
              className="group flex flex-col gap-3"
            >
              <span className="line-clamp-2 min-h-[2.75em] text-lg font-semibold leading-snug text-text transition-colors group-hover:text-accent">
                {entry.title}
              </span>
              <span className="line-clamp-2 leading-relaxed text-text-muted">{entry.summary}</span>
              <span className="pt-2 font-mono text-xs uppercase tracking-[0.12em] text-text-muted/80">
                {entry.version} &middot; {describeReleaseDate(entry.date)}
              </span>
            </Link>
          </motion.li>
        ))}
      </motion.ol>

      <Link
        to="/changelog"
        className="group inline-flex items-center gap-1.5 self-start text-text-muted transition-colors hover:text-text"
      >
        Every release
        <Icon
          of={ArrowRightIcon}
          size={16}
          className="transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5"
        />
      </Link>
    </section>
  );
};

LatestReleases.displayName = 'LatestReleases';

export { LatestReleases };
