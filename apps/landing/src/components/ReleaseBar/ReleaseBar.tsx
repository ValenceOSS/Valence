import { Link } from '@tanstack/react-router';
import { ArrowRight as ArrowRightIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import { CHANGELOG } from '@ValenceLanding/content/changelog/CHANGELOG';

const NEWEST = CHANGELOG[0];

const STRIPES =
  'bg-[repeating-linear-gradient(135deg,var(--color-accent)_0_7px,transparent_7px_14px)]';

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
      className="group relative z-30 flex items-center gap-4 overflow-hidden border-b border-border/60 bg-surface pr-5 font-mono text-xs text-text-muted hover:text-text sm:pr-10"
    >
      <span aria-hidden className={`h-9 w-14 shrink-0 ${STRIPES}`} />
      <span className="shrink-0 font-semibold text-accent">New release</span>
      <span className="shrink-0 font-semibold text-text">{NEWEST.version}</span>
      <span className="hidden min-w-0 flex-1 truncate md:block">{NEWEST.title}</span>
      <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 text-text">
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
