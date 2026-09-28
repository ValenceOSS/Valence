import { Link } from '@tanstack/react-router';
import { ArrowRight as ArrowRightIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import { RevealItem } from '@ValenceUI/RevealItem';
import { ChangelogDate } from '@ValenceLanding/components/ChangelogPage/components/ChangelogDate/ChangelogDate';
import { ChangelogPicture } from '@ValenceLanding/components/ChangelogPage/components/ChangelogPicture/ChangelogPicture';
import type { ChangelogSummaryProps } from './ChangelogSummary.types';

/**
 * One release on the changelog's front page: when it shipped down the left, and its title, its
 * picture and a paragraph about it on the right, each leading to the release's own page.
 *
 * @param entry - The release.
 * @param index - Where it sits in the list, so it arrives in order.
 */
const ChangelogSummary = ({ entry, index }: ChangelogSummaryProps) => (
  <RevealItem
    index={index}
    className="grid list-none gap-4 border-t border-border/60 py-14 first:border-0 md:grid-cols-[14rem_1fr] md:gap-10"
  >
    <div className="md:sticky md:top-28 md:self-start">
      <ChangelogDate date={entry.date} version={entry.version} />
    </div>

    <article className="flex min-w-0 flex-col gap-6">
      <Link
        to="/changelog/$slug"
        params={{ slug: entry.slug }}
        className="text-3xl font-semibold tracking-tight text-text transition-colors hover:text-accent sm:text-4xl"
      >
        {entry.title}
      </Link>

      {entry.picture === undefined ? null : (
        <Link to="/changelog/$slug" params={{ slug: entry.slug }} aria-hidden tabIndex={-1}>
          <ChangelogPicture picture={entry.picture} isEager={index === 0} />
        </Link>
      )}

      <p className="max-w-2xl text-lg leading-relaxed text-text-muted">{entry.summary}</p>

      <Link
        to="/changelog/$slug"
        params={{ slug: entry.slug }}
        className="inline-flex items-center gap-1.5 self-start text-sm text-accent hover:underline"
      >
        Read about {entry.version}
        <Icon of={ArrowRightIcon} size={14} />
      </Link>
    </article>
  </RevealItem>
);

ChangelogSummary.displayName = 'ChangelogSummary';

export { ChangelogSummary };
