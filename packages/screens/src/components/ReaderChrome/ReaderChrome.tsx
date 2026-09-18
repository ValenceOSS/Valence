import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import type { ReaderChromeProps } from './ReaderChrome.types';

/**
 * What every reader has around its page: a way out and the title across the top, the reader's own
 * menus beside it, how far through along the bottom, and the edges of the screen as the places to
 * tap to turn.
 *
 * The bars come and go together, as they are told, and a hidden bar cannot be pressed by accident.
 * The edges are a third of the screen each and always there, because somebody reading turns the page
 * far more often than they reach for anything else; the middle is left to whatever the page is.
 *
 * @param title - What is being read.
 * @param isShown - Whether the bars are showing.
 * @param isRightToLeft - Whether the book is read right to left, which swaps the edges.
 * @param menus - The reader's own menus, beside the title.
 * @param footer - What goes along the bottom.
 * @param children - The page.
 * @param onForward - Turns on.
 * @param onBack - Turns back.
 * @param onClose - Leaves.
 * @param className - Extra classes for the page's surround, such as its colour.
 */
const ReaderChrome = ({
  title,
  isShown,
  isRightToLeft,
  menus,
  footer,
  children,
  onForward,
  onBack,
  onClose,
  className,
}: ReaderChromeProps) => (
  <>
    <header
      className={cn(
        'absolute inset-x-0 top-0 z-10 flex items-center gap-3 p-3',
        'bg-gradient-to-b from-shade/80 to-transparent',
        'transition-opacity duration-[var(--duration-fast)]',
        isShown ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close the reader">
        <Icon of={Cancel01Icon} size={18} />
      </Button>

      <span className="min-w-0 flex-1 truncate text-sm text-on-scrim">{title}</span>

      {menus}
    </header>

    <div className={cn('relative flex min-h-0 flex-1 overflow-hidden', className)}>
      {children}

      <div className="absolute inset-y-0 left-0 flex w-1/3">
        <Button
          variant="ghost"
          className="h-full w-full opacity-0"
          aria-label={isRightToLeft ? 'Next page' : 'Previous page'}
          onClick={isRightToLeft ? onForward : onBack}
        >
          <span />
        </Button>
      </div>

      <div className="absolute inset-y-0 right-0 flex w-1/3">
        <Button
          variant="ghost"
          className="h-full w-full opacity-0"
          aria-label={isRightToLeft ? 'Previous page' : 'Next page'}
          onClick={isRightToLeft ? onBack : onForward}
        >
          <span />
        </Button>
      </div>
    </div>

    <footer
      className={cn(
        'absolute inset-x-0 bottom-0 z-10 flex items-center gap-3 p-3',
        'bg-gradient-to-t from-shade/80 to-transparent',
        'transition-opacity duration-[var(--duration-fast)]',
        isShown ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      {footer}
    </footer>
  </>
);

ReaderChrome.displayName = 'ReaderChrome';

export { ReaderChrome };
