import { useRef, useState } from 'react';
import {
  Bookmark as BookmarkIcon,
  BookmarkPlus as BookmarkPlusIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Maximize as MaximizeIcon,
  Minimize as MinimizeIcon,
} from '@keyline-icons/react';
import { Bookmark as BookmarkFilledIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { PopoverPanel } from '@ValenceUI/PopoverPanel';
import { cn } from '@ValenceUI/cn';
import { useFullscreen } from '@ValenceScreens/reading/useFullscreen';
import type { ReaderChromeProps } from './ReaderChrome.types';
import { say } from '@ValenceI18n/say';

const BAR_MOTION =
  'transition-[translate,opacity] duration-[var(--duration-base)] ease-[var(--ease-out)] motion-reduce:transition-opacity';

/**
 * What every reader has around its page: the way out, what is being read and where across the top
 * with the reader's own menus beside them, how far through along the bottom, and the edges of the
 * screen as the places to tap to turn.
 *
 * The bars are the app's own, light or dark as the rest of Valence is, whatever colour the pages are
 * in. They slide away together to leave only the page, and back when asked; a hidden bar cannot be
 * pressed by accident.
 *
 * The edges are a third of the screen each and always there, because somebody reading turns the page
 * far more often than they reach for anything else; the middle is left to whatever the page is. An
 * arrow sits in each edge for anybody who wants to see where to press, and shows with the bars.
 *
 * The whole reader can be taken to fill the screen, where the browser allows it.
 *
 * @param title - What is being read.
 * @param place - Which chapter or part is open, where it is known.
 * @param isShown - Whether the bars are showing.
 * @param isRightToLeft - Whether the book is read right to left, which swaps the edges.
 * @param isScrolling - Whether the page is a strip to be scrolled, in which case there are no edges
 *   to turn from, and they would only be in the way of the scrolling.
 * @param actions - The reader's own menus, at the end of the top bar.
 * @param footer - What goes along the bottom.
 * @param children - The page.
 * @param onForward - Turns on.
 * @param onBack - Turns back.
 * @param onClose - Leaves.
 * @param onToggle - Puts the bars away, or brings them back, when the page itself is clicked
 *   anywhere that is not a link or a control of its own.
 * @param mark - Whether the page showing is bookmarked, and the way to bookmark it or take the
 *   bookmark away, where the reader keeps bookmarks.
 * @param bookmarks - Every place marked in the book, opened from beside the bookmark, where the
 *   reader keeps bookmarks.
 * @param className - Extra classes for where the page sits, such as how it is aligned.
 */
const ReaderChrome = ({
  title,
  place,
  isShown,
  isRightToLeft,
  isScrolling = false,
  actions,
  footer,
  children,
  onForward,
  onBack,
  onClose,
  onToggle,
  mark,
  bookmarks,
  className,
}: ReaderChromeProps) => {
  const holder = useRef<HTMLDivElement>(null);
  const { isFullscreen, isAvailable, toggle } = useFullscreen(holder);
  const [isListOpen, setIsListOpen] = useState(false);
  const isBarShown = isShown || isListOpen;

  return (
    <div ref={holder} className="relative flex min-h-0 flex-1 flex-col bg-surface text-text">
      <header
        className={cn(
          'absolute inset-x-0 top-0 z-10 grid grid-cols-[1fr_minmax(0,auto)_1fr] items-center gap-3 bg-surface px-3 py-2.5',
          BAR_MOTION,
          isBarShown
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-full opacity-0',
        )}
      >
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            onClick={onClose}
            label={say('screens.readerChrome.closeTheReader')}
          >
            <Icon of={ChevronLeftIcon} size={20} />
          </Button>
        </div>

        <div className="flex min-w-0 flex-col items-center text-center">
          <span className="max-w-full truncate text-sm font-semibold text-text">{title}</span>
          {place === null ? null : (
            <span className="max-w-full truncate text-xs text-text-muted">{place}</span>
          )}
        </div>

        <div className="flex items-center justify-end gap-1">
          {actions}

          {mark === undefined ? null : (
            <Button
              variant="ghost"
              size="sm"
              isActive={mark.isMarked}
              aria-label={
                mark.isMarked ? say('common.removeBookmark') : say('common.bookmarkThisPage')
              }
              onClick={mark.onMark}
            >
              <Icon
                of={BookmarkPlusIcon}
                whenActive={BookmarkFilledIcon}
                isActive={mark.isMarked}
                size={18}
              />
            </Button>
          )}

          {bookmarks === undefined ? null : (
            <PopoverPanel
              tone="default"
              align="end"
              label={say('common.bookmarks')}
              isOpen={isListOpen}
              onOpenChange={setIsListOpen}
              trigger={
                <Icon
                  of={BookmarkIcon}
                  whenActive={BookmarkFilledIcon}
                  isActive={isListOpen}
                  size={20}
                />
              }
              className="w-[min(25rem,calc(100vw-1.5rem))] p-0 py-2"
            >
              {bookmarks}
            </PopoverPanel>
          )}

          {isAvailable ? (
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              label={
                isFullscreen
                  ? say('screens.readerChrome.leaveFullScreen')
                  : say('screens.readerChrome.fillTheScreen')
              }
              onClick={toggle}
            >
              <Icon of={isFullscreen ? MinimizeIcon : MaximizeIcon} size={20} />
            </Button>
          ) : null}
        </div>
      </header>

      <div
        data-reader-surface
        className={cn('relative flex min-h-0 flex-1 overflow-hidden', className)}
        onClickCapture={(event) => {
          if (
            event.target instanceof Element &&
            event.target.closest('a, button, input, [role="slider"]') === null
          ) {
            onToggle();
          }
        }}
      >
        {children}

        {isScrolling ? null : (
          <>
            <div className="absolute top-16 bottom-16 start-0 flex w-1/3">
              <Button
                variant="bare"
                size="none"
                hasTooltip={false}
                label={isRightToLeft ? say('common.nextPage') : say('common.previousPage')}
                className="h-full w-full items-center justify-start px-4"
                onClick={isRightToLeft ? onForward : onBack}
              >
                <Icon
                  of={ChevronLeftIcon}
                  size={28}
                  className={cn(
                    'text-text-muted transition-opacity duration-[var(--duration-fast)]',
                    isBarShown ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </Button>
            </div>

            <div className="absolute top-16 bottom-16 end-0 flex w-1/3">
              <Button
                variant="bare"
                size="none"
                hasTooltip={false}
                label={isRightToLeft ? say('common.previousPage') : say('common.nextPage')}
                className="h-full w-full items-center justify-end px-4"
                onClick={isRightToLeft ? onBack : onForward}
              >
                <Icon
                  of={ChevronRightIcon}
                  size={28}
                  className={cn(
                    'text-text-muted transition-opacity duration-[var(--duration-fast)]',
                    isBarShown ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </Button>
            </div>
          </>
        )}
      </div>

      <footer
        className={cn(
          'absolute inset-x-0 bottom-0 z-10 bg-surface px-6 pt-3 pb-4',
          BAR_MOTION,
          isBarShown
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-full opacity-0',
        )}
      >
        <div className="mx-auto flex w-full max-w-3xl items-center gap-4">{footer}</div>
      </footer>
    </div>
  );
};

ReaderChrome.displayName = 'ReaderChrome';

export { ReaderChrome };
