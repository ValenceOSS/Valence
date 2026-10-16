import { useState } from 'react';
import { ListOrdered as ListOrderedIcon } from '@keyline-icons/react';
import { ListOrdered as ListOrderedFilledIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { PopoverPanel } from '@ValenceUI/PopoverPanel';
import { cn } from '@ValenceUI/cn';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { chapterAt } from '@ValenceClient/playback/chapterAt';
import { nameOfChapter } from '@ValenceClient/playback/nameOfChapter';
import type { ChapterMenuProps } from './ChapterMenu.types';
import { say } from '@ValenceI18n/say';

/**
 * Lists the chapters a film's file marks, by name and where each starts, with the one playing now
 * picked out, so a scene is one press away. Draws nothing for a file of one chapter or none.
 *
 * @param chapters - The film's chapters, in order.
 * @param position - Where playing has reached, to pick out the chapter it is in.
 * @param onSeek - Told where a chosen chapter starts.
 * @param onOpenChange - Told as the list opens or closes, so the bar stays while it is open.
 * @param isDisabled - Whether it is inert, as it is while a session is starting.
 */
const ChapterMenu = ({
  chapters,
  position,
  onSeek,
  onOpenChange,
  isDisabled = false,
}: ChapterMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const show = (next: boolean) => {
    setIsOpen(next);
    onOpenChange?.(next);
  };

  if (chapters.length < 2) {
    return null;
  }

  const playing = chapterAt(chapters, position)?.number ?? null;

  return (
    <PopoverPanel
      tone="default"
      label={say('common.chapters')}
      heading={say('common.chapters')}
      isDisabled={isDisabled}
      isOpen={isOpen}
      onOpenChange={show}
      trigger={
        isOpen ? (
          <Icon of={ListOrderedFilledIcon} size={20} />
        ) : (
          <Icon of={ListOrderedIcon} size={20} />
        )
      }
      className="w-72 sm:w-80 mb-7.5"
    >
      <ul className="flex max-h-80 flex-col overflow-y-auto">
        {chapters.map((chapter, index) => {
          const number = index + 1;
          const isPlaying = number === playing;

          return (
            <li key={`${chapter.startSeconds.toString()}-${number.toString()}`}>
              <Button
                variant="bare"
                size="none"
                hasTooltip={false}
                aria-current={isPlaying ? 'true' : undefined}
                onClick={() => {
                  show(false);
                  onSeek(chapter.startSeconds);
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover-hover:hover:bg-surface-raised',
                  isPlaying ? 'bg-surface-raised' : '',
                )}
              >
                <span className="w-5 shrink-0 text-right text-sm tabular-nums text-text-muted">
                  {number}
                </span>
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate text-sm',
                    isPlaying ? 'font-semibold text-text' : 'text-text',
                  )}
                >
                  {nameOfChapter(chapter, number)}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-text-muted">
                  {formatDuration(chapter.startSeconds)}
                </span>
              </Button>
            </li>
          );
        })}
      </ul>
    </PopoverPanel>
  );
};

ChapterMenu.displayName = 'ChapterMenu';

export { ChapterMenu };
