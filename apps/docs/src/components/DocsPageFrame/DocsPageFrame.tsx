import { SectionCard } from '@ValenceUI/SectionCard';
import { cn } from '@ValenceUI/cn';
import { NAVIGATION } from '@ValenceDocs/content/NAVIGATION';
import { DocsNav } from '@ValenceDocs/components/DocsNav/DocsNav';
import type { DocsPageFrameProps } from './DocsPageFrame.types';

/**
 * What a page of the documentation sits on: a rounded card below the bar, with the list of every
 * page in a panel of its own running the card's whole height on a wide screen, the list staying in
 * view as the page scrolls, and the page itself beside it.
 *
 * @param isWide - Whether the page takes the whole card, as the API reference does, with no list.
 * @param children - The page.
 */
const DocsPageFrame = ({ isWide = false, children }: DocsPageFrameProps) => (
  <div className="pt-20 sm:pt-24">
    <SectionCard>
      <div
        className={cn(
          'grid w-full gap-8 px-3 py-3 sm:px-4 sm:py-4',
          isWide ? '' : 'lg:grid-cols-[17rem_minmax(0,1fr)]',
        )}
      >
        {isWide ? null : (
          <aside className="hidden rounded-2xl border border-border/60 bg-surface-raised lg:block">
            <div className="sticky top-20 max-h-[calc(100svh-5rem)] overflow-y-auto">
              <DocsNav sections={NAVIGATION} />
            </div>
          </aside>
        )}

        <div className="min-w-0">{children}</div>
      </div>
    </SectionCard>
  </div>
);

DocsPageFrame.displayName = 'DocsPageFrame';

export { DocsPageFrame };
