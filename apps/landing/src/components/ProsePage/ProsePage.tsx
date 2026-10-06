import { PageHero } from '@ValenceUI/PageHero';
import { SectionCard } from '@ValenceUI/SectionCard';
import type { ProsePageProps } from './ProsePage.types';

/**
 * A page that is mostly reading, such as the privacy notice or the terms: its name on the opening
 * card with a small line above it, and the text itself in one narrow, easy-to-read column on a card
 * beneath.
 *
 * @param eyebrow - The small line above the name, such as when it was last updated.
 * @param title - The page's name.
 * @param children - The text, section by section.
 */
const ProsePage = ({ eyebrow, title, children }: ProsePageProps) => (
  <>
    <PageHero eyebrow={eyebrow} lead={title} />

    <SectionCard>
      <div className="mx-auto flex max-w-2xl flex-col gap-10 px-5 py-14 text-text-muted sm:px-10 sm:py-20">
        {children}
      </div>
    </SectionCard>
  </>
);

ProsePage.displayName = 'ProsePage';

export { ProsePage };
