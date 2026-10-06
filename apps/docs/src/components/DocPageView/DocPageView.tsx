import { Suspense, useEffect, useState } from 'react';
import { Spinner } from '@ValenceUI/Spinner';
import { Badge } from '@ValenceUI/Badge';
import { Reveal } from '@ValenceUI/Reveal';
import { NAVIGATION } from '@ValenceDocs/content/NAVIGATION';
import { DocsPageFrame } from '@ValenceDocs/components/DocsPageFrame/DocsPageFrame';
import { findNeighbours } from '@ValenceDocs/content/findNeighbours';
import { lazyContent } from '@ValenceDocs/content/lazyContent';
import { DocContent } from '@ValenceDocs/components/DocPageView/components/DocContent/DocContent';
import { OnThisPage } from '@ValenceDocs/components/DocPageView/components/OnThisPage/OnThisPage';
import { PageNeighbours } from '@ValenceDocs/components/DocPageView/components/PageNeighbours/PageNeighbours';
import type { DocPage } from '@ValenceDocs/content/DocPage.types';
import type { PageHeading } from '@ValenceDocs/components/DocPageView/components/DocContent/readHeadings';

type DocPageViewProps = {
  page: DocPage;
};

/**
 * One page of the documentation, on its card beside the list of pages: its title, its content, the
 * list of its sections and the pages either side of it.
 *
 * @param page - The page to show.
 */
const DocPageView = ({ page }: DocPageViewProps) => {
  const [headings, setHeadings] = useState<readonly PageHeading[]>([]);

  useEffect(() => {
    document.title = `${page.title} | Valence Docs`;
    window.scrollTo({ top: 0 });
    setHeadings([]);
  }, [page]);

  return (
    <DocsPageFrame>
      <div className="flex gap-12 px-2 py-2 sm:px-6 lg:px-10">
        <article className="min-w-0 max-w-3xl flex-1">
          <Reveal key={`${page.path}-header`}>
            <Badge>{page.sectionTitle}</Badge>

            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.03em] text-text sm:text-5xl">
              {page.title}
            </h1>

            <p className="mt-3 text-lg leading-8 text-text-muted">{page.description}</p>
          </Reveal>

          <Reveal key={`${page.path}-body`} delay={0.1}>
            <Suspense
              fallback={
                <div className="flex justify-center py-24">
                  <Spinner label="Loading the page" />
                </div>
              }
            >
              <DocContent Content={lazyContent(page)} onHeadings={setHeadings} />
            </Suspense>

            <PageNeighbours {...findNeighbours(NAVIGATION, page.path)} />
          </Reveal>
        </article>

        <OnThisPage headings={headings} />
      </div>
    </DocsPageFrame>
  );
};

DocPageView.displayName = 'DocPageView';

export type { DocPageViewProps };

export { DocPageView };
