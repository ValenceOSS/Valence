import type { SectionCardProps } from './SectionCard.types';

/**
 * A rounded card a little in from the window's edges that one part of a page sits on, so the page
 * reads as cards laid one after another. The card is a darker grey than the page, and anything
 * inside that paints itself in the page's colour takes the card's instead.
 *
 * @param children - What sits on the card.
 */
const SectionCard = ({ children }: SectionCardProps) => (
  <div className="px-2 pt-2 sm:px-3 sm:pt-3">
    <div className="overflow-clip rounded-[2rem] border border-border/60 bg-surface [--frame-back:var(--color-surface)] sm:rounded-[2.5rem]">
      {children}
    </div>
  </div>
);

SectionCard.displayName = 'SectionCard';

export { SectionCard };
