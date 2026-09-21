import { cn } from '@ValenceUI/cn';
import type { PageHeading } from '@ValenceDocs/components/DocPageView/components/DocContent/readHeadings';

type OnThisPageProps = {
  headings: readonly PageHeading[];
};

/**
 * The list of a page's sections, down the right of a wide screen, each linking to its heading.
 *
 * @param headings - The page's headings.
 */
const OnThisPage = ({ headings }: OnThisPageProps) =>
  headings.length < 2 ? null : (
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
              className={cn(
                'block text-sm text-text-muted transition-colors hover:text-text',
                heading.level === 2 ? 'pl-3' : 'pl-6',
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );

OnThisPage.displayName = 'OnThisPage';

export type { OnThisPageProps };

export { OnThisPage };
