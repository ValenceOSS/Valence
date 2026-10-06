import { SectionCard } from '@ValenceUI/SectionCard';
import { cn } from '@ValenceUI/cn';
import { NAVIGATION } from '@ValenceDocs/content/NAVIGATION';
import { DocsNav } from '@ValenceDocs/components/DocsNav/DocsNav';
import type { DocsPageFrameProps } from './DocsPageFrame.types';

/**
 * What a page of the documentation sits on: a rounded card below the bar, with the list of every
 * page in a panel of its own down the side on a wide screen and the page itself beside it.
 *
 * @param isWide - Whether the page takes the whole card, as the API reference does, with no list.
 * @param children - The page.
 */
const DocsPageFrame = ({ isWide = false, children }: DocsPageFrameProps) => (
  <div className="pt-20 sm:pt-24">
    <SectionCard>
      <div
        className={cn(
          'mx-auto grid w-full max-w-[96rem] gap-8 px-4 py-8 sm:px-6 sm:py-10',
          isWide ? '' : 'lg:grid-cols-[17rem_minmax(0,1fr)]',
        )}
      >
        {isWide ? null : (
          <aside className="sticky top-24 hidden h-[calc(100svh-7.75rem)] self-start overflow-y-auto rounded-2xl border border-border/60 bg-surface-raised lg:block">
            <DocsNav sections={NAVIGATION} />
          </aside>
        )}

        <div className="min-w-0">{children}</div>
      </div>
    </SectionCard>
  </div>
);

DocsPageFrame.displayName = 'DocsPageFrame';

export { DocsPageFrame };
