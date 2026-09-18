import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { Cancel01Icon, SidebarRight01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { stillTransition } from '@ValenceUI/animations/reveal';
import { VALENCE_TOKENS } from '@ValenceUI/tokens';
import type { ReaderChromeProps } from './ReaderChrome.types';

const PANEL_ROOM = '21rem';

const OPENING = { duration: VALENCE_TOKENS.duration.slow, ease: VALENCE_TOKENS.ease.soft };

/**
 * What every reader has around its page: a way out and the title across the top, how far through
 * along the bottom, the edges of the screen as the places to tap to turn, and a panel down the side
 * with everything else.
 *
 * The bars come and go together, as they are told, and a hidden bar cannot be pressed by accident.
 * The edges are a third of the screen each and always there, because somebody reading turns the page
 * far more often than they reach for anything else; the middle is left to whatever the page is.
 *
 * The panel is either pinned, in which case the page makes room for it and it stays, or loose, in
 * which case it slides over the page from the side it lives on and touching the page puts it away.
 * Either way it arrives from and leaves by the same edge.
 *
 * @param title - What is being read.
 * @param isShown - Whether the bars are showing.
 * @param isRightToLeft - Whether the book is read right to left, which swaps the edges.
 * @param panel - The reader's side panel.
 * @param isPanelOpen - Whether the panel is out.
 * @param isPanelPinned - Whether the panel stays beside the page.
 * @param onPanelOpenChange - Told to bring the panel out, or put it away.
 * @param footer - What goes along the bottom.
 * @param children - The page.
 * @param onForward - Turns on.
 * @param onBack - Turns back.
 * @param onClose - Leaves.
 * @param className - Extra classes for where the page sits, such as how it is aligned.
 */
const ReaderChrome = ({
  title,
  isShown,
  isRightToLeft,
  panel,
  isPanelOpen,
  isPanelPinned,
  onPanelOpenChange,
  footer,
  children,
  onForward,
  onBack,
  onClose,
  className,
}: ReaderChromeProps) => {
  const isStill = useReducedMotionConfig() === true;
  const moving = isStill ? stillTransition : OPENING;

  return (
    <div className="relative flex min-h-0 flex-1">
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <header
          className={cn(
            'absolute inset-x-0 top-0 z-10 flex items-center gap-3 p-3',
            'bg-gradient-to-b from-shade/80 to-transparent',
            'transition-opacity duration-[var(--duration-fast)]',
            isShown || isPanelOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close the reader">
            <Icon of={Cancel01Icon} size={18} />
          </Button>

          <span className="min-w-0 flex-1 truncate text-sm text-on-scrim">{title}</span>

          <Button
            variant="ghost"
            size="sm"
            isActive={isPanelOpen}
            aria-label={isPanelOpen ? 'Put the panel away' : 'Bring out the panel'}
            onClick={() => {
              onPanelOpenChange(!isPanelOpen);
            }}
          >
            <Icon of={SidebarRight01Icon} size={18} />
          </Button>
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
      </div>

      <AnimatePresence initial={false}>
        {!isPanelOpen ? null : isPanelPinned ? (
          <motion.div
            key="pinned"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: PANEL_ROOM, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={moving}
            className="flex min-h-0 shrink-0 justify-end overflow-hidden py-2 pr-2"
          >
            {panel}
          </motion.div>
        ) : (
          <motion.div
            key="loose"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={moving}
            className="absolute inset-0 z-30 flex justify-end"
          >
            <Button
              variant="bare"
              className="absolute inset-0 cursor-default bg-shade/30"
              aria-label="Put the panel away"
              onClick={() => {
                onPanelOpenChange(false);
              }}
            >
              <span />
            </Button>

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={moving}
              className="relative flex min-h-0 py-2 pr-2"
            >
              {panel}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

ReaderChrome.displayName = 'ReaderChrome';

export { ReaderChrome };
