import type { InfoNoteProps } from './InfoNote.types';

/**
 * A sentence in an information card that qualifies what the rows above it say, set off by a rule
 * and in quieter type, so a card of facts can explain itself without the explanation reading as one
 * more fact.
 *
 * @param children - What to say.
 */
const InfoNote = ({ children }: InfoNoteProps) => (
  <span className="mt-1 block border-t border-[var(--surface-line)] px-2.5 pb-1 pt-1.5 font-body text-xs leading-relaxed text-text-muted">
    {children}
  </span>
);

InfoNote.displayName = 'InfoNote';

export { InfoNote };
