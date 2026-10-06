import { Link, useRouterState } from '@tanstack/react-router';
import { ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import { ChangelogPicture } from '@ValenceLanding/components/ChangelogPage/components/ChangelogPicture/ChangelogPicture';
import { PageHero } from '@ValenceLanding/components/PageHero/PageHero';
import { SectionCard } from '@ValenceLanding/components/SectionCard/SectionCard';
import { describeReleaseDate } from '@ValenceLanding/content/changelog/describeReleaseDate';
import { PageProblem } from '@ValenceLanding/components/PageProblem/PageProblem';
import { CHANGELOG } from '@ValenceLanding/content/changelog/CHANGELOG';

const PREFIX = '/changelog/';

/**
 * One release on a page of its own: its version, when it shipped, what it is called and what it
 * brings on the opening card, then on a card beneath it a picture of it, what is new section by
 * section with pictures between them, the smaller improvements and fixes as lists, and the
 * releases either side of it at the foot.
 */
const ChangelogEntryPage = () => {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const slug = pathname.slice(PREFIX.length).replace(/\/+$/u, '');
  const at = CHANGELOG.findIndex((entry) => entry.slug === slug);
  const entry = CHANGELOG[at];

  if (entry === undefined) {
    return <PageProblem />;
  }

  const newer = CHANGELOG[at - 1];
  const older = CHANGELOG[at + 1];

  return (
    <>
      <PageHero
        eyebrow={
          <>
            {entry.version} &middot;{' '}
            <time dateTime={entry.date}>{describeReleaseDate(entry.date)}</time>
          </>
        }
        lead={entry.title}
        description={entry.summary}
        actions={
          <Link
            to="/changelog"
            className="inline-flex items-center gap-1.5 text-sm text-on-scrim/75 transition-colors hover:text-on-scrim"
          >
            <Icon of={ArrowLeftIcon} size={14} />
            Every release
          </Link>
        }
      />

      <SectionCard>
        <article className="mx-auto flex max-w-3xl flex-col gap-10 px-5 py-12 sm:px-10 sm:py-16">
          {entry.picture === undefined ? null : (
            <ChangelogPicture picture={entry.picture} isEager />
          )}

          {entry.sections.map((section) => (
            <section key={section.title} className="flex flex-col gap-4">
              <h2 className="text-2xl font-semibold tracking-tight text-text">{section.title}</h2>
              <p className="text-base leading-relaxed text-text-muted">{section.body}</p>
              {section.picture === undefined ? null : (
                <ChangelogPicture picture={section.picture} />
              )}
            </section>
          ))}

          {entry.lists.map((list) => (
            <section
              key={list.title}
              className="flex flex-col gap-4 border-t border-border/60 pt-8"
            >
              <h2 className="text-lg font-semibold text-text">{list.title}</h2>
              <ul className="flex flex-col gap-2.5 pl-5 text-base leading-relaxed text-text-muted">
                {list.items.map((item) => (
                  <li key={item} className="list-disc marker:text-border">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <nav
            aria-label="Other releases"
            className="grid gap-4 border-t border-border/60 pt-8 sm:grid-cols-2"
          >
            {newer === undefined ? (
              <span />
            ) : (
              <Link
                to="/changelog/$slug"
                params={{ slug: newer.slug }}
                className="flex flex-col gap-1 rounded-xl border border-border/60 p-4 transition-colors hover:border-accent/50"
              >
                <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                  <Icon of={ArrowLeftIcon} size={12} />
                  Newer · {newer.version}
                </span>
                <span className="text-sm text-text">{newer.title}</span>
              </Link>
            )}

            {older === undefined ? null : (
              <Link
                to="/changelog/$slug"
                params={{ slug: older.slug }}
                className="flex flex-col items-end gap-1 rounded-xl border border-border/60 p-4 text-right transition-colors hover:border-accent/50"
              >
                <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                  Older · {older.version}
                  <Icon of={ArrowRightIcon} size={12} />
                </span>
                <span className="text-sm text-text">{older.title}</span>
              </Link>
            )}
          </nav>
        </article>
      </SectionCard>
    </>
  );
};

ChangelogEntryPage.displayName = 'ChangelogEntryPage';

export { ChangelogEntryPage };
