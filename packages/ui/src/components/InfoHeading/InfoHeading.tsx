import type { InfoHeadingProps } from './InfoHeading.types';

/**
 * The line at the top of an information card, quiet and set off by a rule, saying what the card is
 * about or when what it shows was read — drawn as a menu's own heading is, so a card of facts and a
 * menu of choices read as one family.
 *
 * @param children - What to say.
 */
const InfoHeading = ({ children }: InfoHeadingProps) => (
  <span className="mb-1 block border-b border-[var(--surface-line)] px-2.5 pb-1.5 pt-1 text-[0.6875rem] font-medium text-text-muted">
    {children}
  </span>
);

InfoHeading.displayName = 'InfoHeading';

export { InfoHeading };
