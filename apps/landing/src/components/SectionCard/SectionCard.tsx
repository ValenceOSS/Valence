import { cn } from '@ValenceUI/cn';
import type { SectionCardProps } from './SectionCard.types';

/**
 * A rounded card a little in from the window's edges that one part of a page sits on, so the page
 * reads as cards laid one after another. A raised card is the darker grey, and anything inside
 * that paints itself in the page's colour takes the card's instead.
 *
 * @param isRaised - Whether the card is the darker grey rather than the page's own.
 * @param children - What sits on the card.
 */
const SectionCard = ({ isRaised = false, children }: SectionCardProps) => (
  <div className="px-2 pt-2 sm:px-3 sm:pt-3">
    <div
      className={cn(
        'overflow-clip rounded-[2rem] border border-border/60 sm:rounded-[2.5rem]',
        isRaised ? 'bg-surface [--frame-back:var(--color-surface)]' : 'bg-[var(--frame-back)]',
      )}
    >
      {children}
    </div>
  </div>
);

SectionCard.displayName = 'SectionCard';

export { SectionCard };
