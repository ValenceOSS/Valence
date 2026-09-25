import {
  Book as BookIcon,
  File as FileIcon,
  MapPin as MapPinIcon,
  MapPinOff as MapPinOffIcon,
  X as XIcon,
} from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import type { ReaderPanelProps } from './ReaderPanel.types';
import { say } from '@ValenceI18n/say';

/**
 * Everything a reader can be told, in one panel down the side of the page rather than a menu over
 * it: what is being read and where, the way to any other place in it, and how it is laid out.
 *
 * Laid out the way the rest of Valence lays out settings — a list of rows, each naming what it
 * changes, with the choice beside it — so the reader is not a place with its own vocabulary. It can
 * be pinned to stay beside the page, or left loose to come and go.
 *
 * @param bookTitle - What is being read.
 * @param placeTitle - Which chapter or part is open, where there is more than one.
 * @param isPinned - Whether the panel stays beside the page.
 * @param onPinnedChange - Told to pin the panel, or let it go.
 * @param onClose - Told to put the panel away.
 * @param pickers - The ways to move to another place in the book.
 * @param children - The settings for how the book is shown.
 */
const ReaderPanel = ({
  bookTitle,
  placeTitle,
  isPinned,
  onPinnedChange,
  onClose,
  pickers,
  children,
}: ReaderPanelProps) => (
  <aside
    aria-label={say('screens.readerPanel.label')}
    className="valence-card-shell flex h-full min-h-0 w-[20rem] max-w-[calc(100vw-1rem)] shrink-0"
  >
    <div className="valence-card-face flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-4">
        <Button
          variant="ghost"
          size="xs"
          isIconOnly
          label={say('screens.readerPanel.putAway')}
          onClick={onClose}
        >
          <Icon of={XIcon} size={16} />
        </Button>

        <Button
          variant="ghost"
          size="xs"
          isIconOnly
          isActive={isPinned}
          label={
            isPinned ? say('screens.readerPanel.letGo') : say('screens.readerPanel.keepBeside')
          }
          onClick={() => {
            onPinnedChange(!isPinned);
          }}
        >
          <Icon of={isPinned ? MapPinOffIcon : MapPinIcon} size={16} />
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-5">
        <div className="flex flex-col gap-2">
          <span className="flex items-start gap-2.5 text-base font-semibold tracking-tight text-text">
            <Icon of={BookIcon} size={18} tone="muted" className="mt-0.5 shrink-0" />
            <span className="min-w-0">{bookTitle}</span>
          </span>

          {placeTitle === null ? null : (
            <span className="flex items-start gap-2.5 text-sm text-text-muted">
              <Icon of={FileIcon} size={18} className="mt-0.5 shrink-0" />
              <span className="min-w-0">{placeTitle}</span>
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">{pickers}</div>

        <div className="-mx-4 border-t border-[var(--surface-line)]" />

        <div className="-mx-4 flex flex-col">{children}</div>
      </div>
    </div>
  </aside>
);

ReaderPanel.displayName = 'ReaderPanel';

export { ReaderPanel };
