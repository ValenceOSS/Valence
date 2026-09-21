import { cn } from '@ValenceUI/cn';
import { useActiveHeading } from '@ValenceDocs/components/DocPageView/components/OnThisPage/useActiveHeading';
import type { PageHeading } from '@ValenceDocs/components/DocPageView/components/DocContent/readHeadings';

type OnThisPageProps = {
  headings: readonly PageHeading[];
};

/**
 * The list of a page's sections, down the right of a wide screen, each linking to its heading.
 *
 * @param headings - The page's headings.
 */
const OnThisPage = ({ headings }: OnThisPageProps) => {
  const active = useActiveHeading(headings);

  return headings.length < 2 ? null : (
    <nav
      aria-label="On this page"
      className="sticky top-24 hidden max-h-[calc(100dvh-8rem)] w-56 shrink-0 self-start overflow-y-auto xl:block"
    >
      <p className="pb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
        On this page
      </p>

      <ul className="flex flex-col gap-1.5 border-l border-border">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              aria-current={heading.id === active ? 'location' : undefined}
              className={cn(
                '-ml-px block border-l-2 py-0.5 text-sm transition-colors',
                heading.level === 2 ? 'pl-3' : 'pl-6',
                heading.id === active
                  ? 'border-accent font-medium text-accent'
                  : 'border-transparent text-text-muted hover:text-text',
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

OnThisPage.displayName = 'OnThisPage';

export type { OnThisPageProps };

export { OnThisPage };
