import { Link } from '@tanstack/react-router';
import { ArrowRight as ArrowRightIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import { CHANGELOG } from '@ValenceLanding/content/changelog/CHANGELOG';
import { RELEASE_BAR_PX } from './RELEASE_BAR_PX';

const NEWEST = CHANGELOG[0];

/**
 * The thin line across the very top of every page that says what the newest release brought, with
 * its version, and leads to the changelog: the first thing a returning visitor wants to know is what
 * is new since they last looked.
 */
const ReleaseBar = () =>
  NEWEST === undefined ? null : (
    <Link
      to="/changelog/$slug"
      params={{ slug: NEWEST.slug }}
      style={{ height: RELEASE_BAR_PX }}
      className="group relative z-30 flex items-center gap-4 overflow-hidden border-b border-border/60 bg-surface px-5 text-[0.8125rem] font-light text-text-muted hover:text-text sm:px-10"
    >
      <span className="shrink-0 font-medium text-accent">New release</span>
      <span className="shrink-0 font-medium text-text">{NEWEST.version}</span>
      <span className="hidden min-w-0 flex-1 truncate md:block">{NEWEST.title}</span>
      <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 font-medium text-text">
        Read the changelog
        <Icon
          of={ArrowRightIcon}
          size={14}
          className="transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );

ReleaseBar.displayName = 'ReleaseBar';

export { ReleaseBar };
