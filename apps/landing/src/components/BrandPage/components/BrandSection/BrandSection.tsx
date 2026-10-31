import { SectionCard } from '@ValenceUI/SectionCard';
import type { BrandSectionProps } from './BrandSection.types';

/**
 * One part of the brand page on a card of its own: a title and a line saying what the part is for, anything to download beside them, and the part itself beneath.
 *
 * @param id - Where a link can jump to it.
 * @param actions - What can be downloaded from it, set beside the title on a wide screen.
 */
const BrandSection = ({ id, title, text, actions, children }: BrandSectionProps) => (
  <SectionCard>
    <section
      id={id}
      aria-label={title}
      className="mx-auto flex max-w-7xl scroll-mt-28 flex-col gap-10 px-5 py-16 sm:px-10 sm:py-20"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-2xl flex-col gap-3">
          <h2 className="text-balance text-3xl font-semibold tracking-[-0.03em] text-text sm:text-4xl">
            {title}
          </h2>
          <p className="text-pretty text-base leading-relaxed text-text-muted">{text}</p>
        </div>
        {actions === undefined ? null : <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  </SectionCard>
);

BrandSection.displayName = 'BrandSection';

export { BrandSection };
