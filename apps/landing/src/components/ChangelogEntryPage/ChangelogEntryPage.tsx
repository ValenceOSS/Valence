import { Link, useRouterState } from '@tanstack/react-router';
import { ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import { ChangelogDate } from '@ValenceLanding/components/ChangelogPage/components/ChangelogDate/ChangelogDate';
import { ChangelogPicture } from '@ValenceLanding/components/ChangelogPage/components/ChangelogPicture/ChangelogPicture';
import { PageProblem } from '@ValenceLanding/components/PageProblem/PageProblem';
import { CHANGELOG } from '@ValenceLanding/content/changelog/CHANGELOG';

const PREFIX = '/changelog/';

/**
 * One release on a page of its own: when it shipped, what it is called, a picture of it, what is new
 * section by section with pictures between them, then the smaller improvements and fixes as lists,
 * and the releases either side of it at the foot.
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
    <article className="mx-auto flex max-w-3xl flex-col gap-10 px-5 pb-24 pt-32 sm:px-10">
      <Link
        to="/changelog"
        className="inline-flex items-center gap-1.5 self-start text-sm text-text-muted transition-colors hover:text-text"
      >
        <Icon of={ArrowLeftIcon} size={14} />
        Changelog
      </Link>

      <header className="flex flex-col gap-5">
        <ChangelogDate date={entry.date} version={entry.version} />
        <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-text sm:text-5xl">
          {entry.title}
        </h1>
      </header>

      {entry.picture === undefined ? null : <ChangelogPicture picture={entry.picture} isEager />}

      <p className="text-lg leading-relaxed text-text">{entry.summary}</p>

      {entry.sections.map((section) => (
        <section key={section.title} className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-text">{section.title}</h2>
          <p className="text-base leading-relaxed text-text-muted">{section.body}</p>
          {section.picture === undefined ? null : <ChangelogPicture picture={section.picture} />}
        </section>
      ))}

      {entry.lists.map((list) => (
        <section key={list.title} className="flex flex-col gap-4 border-t border-border/60 pt-8">
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
  );
};

ChangelogEntryPage.displayName = 'ChangelogEntryPage';

export { ChangelogEntryPage };
