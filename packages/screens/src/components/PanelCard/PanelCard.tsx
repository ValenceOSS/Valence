import { cn } from '@ValenceUI/cn';
import type { PanelCardProps } from './PanelCard.types';

/**
 * One block of a panel — in the admin and account dialogs alike: a tinted shell carrying what the block is and what can be done to
 * it, and a panel set into the shell carrying the block itself — the same two layers the figures at
 * the top of the overview are drawn in, so every panel is built from one kind of piece.
 *
 * The heading and its controls live in the shell rather than on the panel, so the panel holds only
 * content and a table inside it can run to its edges.
 *
 * @param title - What the block is called. Every block says, even where the tab above already
 *   does — the shell's heading is what makes the block read as one piece rather than a loose panel.
 * @param actions - Controls for the whole block, set at the right of the shell. Draw them with
 *   PanelCardAction, which is transparent and small: they sit in a strip of heading, not on the page.
 * @param below - A row beneath the heading, such as the block's own tabs.
 * @param children - The block itself.
 * @param isFlush - Whether the content runs to the panel's edges, for a table or a list that
 *   brings its own inner spacing.
 * @param isHighlighted - Whether the block is ringed in the accent, to say it is the one that is new
 *   or needs looking at.
 * @param className - Extra classes for the caller's own layout.
 */
const PanelCard = ({
  title,
  actions,
  below,
  children,
  isFlush = false,
  isHighlighted = false,
  className,
}: PanelCardProps) => (
  <section
    className={cn(
      'valence-card-shell flex flex-col',
      isHighlighted && 'ring-1 ring-accent/40',
      className,
    )}
  >
    <header className="flex flex-col gap-2 px-3 py-1">
      <div className="flex min-h-10 flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs uppercase tracking-[0.16em] text-text-muted">{title}</h3>

        {actions === undefined ? null : (
          <div className="ml-auto flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>

      {below === undefined ? null : below}
    </header>

    <div
      className={cn('valence-card-face flex flex-1 flex-col overflow-hidden', isFlush ? '' : 'p-4')}
    >
      {children}
    </div>
  </section>
);

PanelCard.displayName = 'PanelCard';

export { PanelCard };
