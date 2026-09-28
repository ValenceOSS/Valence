import { cn } from '@ValenceUI/cn';
import type { MockPanelProps } from './MockPanel.types';

/**
 * The app's own panel as a picture: its shell, its small capitalised title with anything it can
 * do beside it, and its raised face, drawn with the same classes as the real thing.
 *
 * @param title - What the panel is.
 * @param actions - What sits at the right of its title.
 * @param isFlush - Whether its face runs to its edges rather than being padded.
 * @param children - What is on its face.
 * @param className - Extra classes for the caller's own layout.
 */
const MockPanel = ({ title, actions, isFlush = false, children, className }: MockPanelProps) => (
  <section
    className={cn(
      'valence-card-shell flex w-full max-w-[var(--vignette-width)] flex-col text-left shadow-[var(--shadow-lifted)]',
      className,
    )}
  >
    <header className="flex min-h-9 items-center justify-between gap-2 px-3 py-0.5">
      <h3 className="text-[0.6875rem] uppercase tracking-[0.16em] text-text-muted">{title}</h3>
      {actions === undefined ? null : <span className="flex items-center gap-2">{actions}</span>}
    </header>

    <div
      className={cn(
        'valence-card-face valence-card-face--raised flex flex-col overflow-hidden',
        isFlush ? '' : 'p-3',
      )}
    >
      {children}
    </div>
  </section>
);

MockPanel.displayName = 'MockPanel';

export { MockPanel };
