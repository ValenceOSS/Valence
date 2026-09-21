import { useId } from 'react';
import { Well } from '@ValenceUI/Well';
import { cn } from '@ValenceUI/cn';
import type { HeadedSectionProps } from './HeadedSection.types';

/**
 * A part of a page with a heading, laid flat on the page: a small title over a thin line, with
 * whatever controls belong to the part at the end of it, and the content beneath. It draws no box, so
 * it is never a card, and can never end up as a card inside one.
 *
 * @param title - What the section is.
 * @param actions - Controls for the section, set at the end of its heading.
 * @param children - The section's content.
 * @param isInset - Whether the content sits in a darker rounded well, for a chart, list or table.
 * @param className - Extra classes for the caller's own layout.
 */
const HeadedSection = ({
  title,
  actions,
  children,
  isInset = false,
  className,
}: HeadedSectionProps) => {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className={cn('flex flex-col gap-3', className)}>
      <header className="flex min-h-8 flex-wrap items-center justify-between gap-2 border-b border-[var(--surface-line)] pb-2">
        <h2
          id={headingId}
          className="text-xs font-medium uppercase tracking-[0.16em] text-text-muted"
        >
          {title}
        </h2>

        {actions === undefined ? null : (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </header>

      {isInset ? <Well className="flex min-h-0 flex-1 flex-col">{children}</Well> : children}
    </section>
  );
};

HeadedSection.displayName = 'HeadedSection';

export { HeadedSection };
