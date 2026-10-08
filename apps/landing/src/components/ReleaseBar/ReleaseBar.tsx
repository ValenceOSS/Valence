import { Link } from '@tanstack/react-router';
import { ArrowRight as ArrowRightIcon } from '@keyline-icons/react';
import { Sparkles as SparklesIcon } from '@keyline-icons/react/fill';
import { Badge } from '@ValenceUI/Badge';
import { Icon } from '@ValenceUI/Icon';
import { CHANGELOG } from '@ValenceLanding/content/changelog/CHANGELOG';
import { describeReleaseDate } from '@ValenceLanding/content/changelog/describeReleaseDate';

const NEWEST = CHANGELOG[0];

/**
 * The line across the top of the navigation that says what the newest release brought and leads
 * to its page: the first thing a returning visitor wants to know is what is new since they last
 * looked. It lays itself across whatever columns the navigation has, so the version, as a badge,
 * sits over the name, what the release is called sits over the links, and when it
 * shipped sits by the way in at the far end.
 */
const ReleaseBar = () =>
  NEWEST === undefined ? null : (
    <Link
      to="/changelog/$slug"
      params={{ slug: NEWEST.slug }}
      className="group col-span-full grid h-8 grid-cols-subgrid items-center px-1 text-[0.8125rem] no-underline outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
    >
      <span className="flex items-center whitespace-nowrap">
        <Badge tone="accent" size="sm" icon={SparklesIcon}>
          {NEWEST.version}
        </Badge>
      </span>

      <span className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 font-medium text-text">New release</span>
        <span aria-hidden className="hidden text-text-muted/50 md:inline">
          &mdash;
        </span>
        <span className="hidden min-w-0 truncate text-text-muted transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] group-hover:text-text md:block">
          {NEWEST.title}
        </span>
      </span>

      <span className="col-start-3 inline-flex items-center gap-3 justify-self-end whitespace-nowrap text-text-muted">
        <time dateTime={NEWEST.date} className="hidden lg:inline">
          {describeReleaseDate(NEWEST.date)}
        </time>
        <span className="inline-flex items-center gap-1.5 font-medium text-text">
          <span className="hidden sm:inline">Changelog</span>
          <Icon
            of={ArrowRightIcon}
            size={14}
            className="transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out)] group-hover:translate-x-0.5"
          />
        </span>
      </span>
    </Link>
  );

ReleaseBar.displayName = 'ReleaseBar';

export { ReleaseBar };
