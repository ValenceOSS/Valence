import { useEffect, useRef, useState } from 'react';
import { ListOrdered as ListOrderedIcon } from '@keyline-icons/react';
import { ListOrdered as ListOrderedFilledIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { PopoverPanel } from '@ValenceUI/PopoverPanel';
import { ScrollFade } from '@ValenceUI/ScrollFade';
import { HoverHighlight } from '@ValenceUI/HoverHighlight';
import { useSlidingHighlight } from '@ValenceUI/useSlidingHighlight';
import { cn } from '@ValenceUI/cn';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { chapterAt } from '@ValenceClient/playback/chapterAt';
import { nameOfChapter } from '@ValenceClient/playback/nameOfChapter';
import { describeLength } from '@ValenceClient/books/describeLength';
import { PLAYER_MENU_OFFSET } from '@ValenceScreens/components/VideoPlayer/PLAYER_MENU_OFFSET';
import type { ChapterMenuProps } from './ChapterMenu.types';
import { say } from '@ValenceI18n/say';

/**
 * Lists the chapters a film's file marks. Every row has a small frame from where the chapter
 * starts, its name, when it runs and for how long; the one playing now is outlined and fills as it
 * plays, and the ones already passed sit quieter. Opening it scrolls the chapter playing into view. Draws nothing for a file of one
 * chapter or none.
 *
 * @param chapters - The film's chapters, in order.
 * @param position - Where playing has reached, to pick out the chapter it is in.
 * @param onSeek - Told where a chosen chapter starts.
 * @param onOpenChange - Told as the list opens or closes, so the bar stays while it is open.
 * @param isDisabled - Whether it is inert, as it is while a session is starting.
 * @param renderFrame - How to draw the picture where a chapter starts.
 */
const ChapterMenu = ({
  chapters,
  position,
  onSeek,
  onOpenChange,
  isDisabled = false,
  renderFrame,
}: ChapterMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { containerRef, rect, follow, clear } = useSlidingHighlight();
  const playingRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      playingRef.current?.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen]);

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
      offset={PLAYER_MENU_OFFSET}
      label={say('common.chapters')}
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
      className="w-[min(20rem,calc(100vw-1.5rem))] p-1.5"
    >
      <ScrollFade className="max-h-[min(30rem,60vh)] pr-1">
        <div
          ref={containerRef}
          onPointerMove={follow}
          onPointerLeave={clear}
          onFocusCapture={follow}
          onBlurCapture={clear}
          className="relative"
        >
          <HoverHighlight rect={rect} radius="nested" />

          <ul className="relative flex flex-col gap-0.5">
            {chapters.map((chapter, index) => {
              const number = index + 1;
              const isPlaying = number === playing;
              const length = Math.max(chapter.endSeconds - chapter.startSeconds, 1);
              const through = Math.min(Math.max((position - chapter.startSeconds) / length, 0), 1);

              return (
                <li
                  key={`${chapter.startSeconds.toString()}-${number.toString()}`}
                  {...(isPlaying
                    ? {
                        ref: (element: HTMLLIElement | null) => {
                          playingRef.current = element;
                        },
                      }
                    : {})}
                >
                  <Button
                    variant="bare"
                    size="none"
                    hasTooltip={false}
                    aria-current={isPlaying ? 'true' : undefined}
                    {...(isPlaying
                      ? { onPointerEnter: clear, onFocus: clear }
                      : { 'data-highlight': number.toString() })}
                    onClick={() => {
                      show(false);
                      onSeek(chapter.startSeconds);
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-1.5 py-2 text-left outline-none focus-visible:focus-ring',
                      'transition-[background-color,scale,opacity] duration-[var(--duration-fast)] ease-[var(--ease-out)]',
                      'active:scale-[0.99] motion-reduce:transition-none',
                      isPlaying
                        ? 'bg-surface-raised'
                        : 'opacity-55 hover-hover:hover:opacity-100 focus-visible:opacity-100',
                    )}
                  >
                    <span
                      className={cn(
                        'relative block aspect-video w-[5.5rem] shrink-0 overflow-hidden rounded-md bg-shade',
                        isPlaying ? 'ring-2 ring-text/40' : 'ring-1 ring-line',
                      )}
                    >
                      {renderFrame === undefined ? null : (
                        <span className="absolute inset-0 grid place-items-center *:rounded-none *:bg-transparent [&_[role=img]]:rounded-none">
                          {renderFrame(chapter.startSeconds)}
                        </span>
                      )}

                      {isPlaying ? (
                        <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-shade/50">
                          <span
                            className="block h-full origin-left bg-on-scrim"
                            style={{ transform: `scaleX(${through.toString()})` }}
                          />
                        </span>
                      ) : null}
                    </span>

                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span
                        className={cn(
                          'truncate text-sm',
                          isPlaying ? 'font-semibold text-text' : 'font-medium',
                          'text-text',
                        )}
                      >
                        {nameOfChapter(chapter, number)}
                      </span>

                      <span className="truncate text-xs tabular-nums text-text-muted">
                        {formatDuration(chapter.startSeconds)}–{formatDuration(chapter.endSeconds)}
                      </span>
                    </span>

                    <span className="w-12 shrink-0 pr-1 text-right text-xs tabular-nums text-text-muted">
                      {describeLength(length)}
                    </span>
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      </ScrollFade>
    </PopoverPanel>
  );
};

ChapterMenu.displayName = 'ChapterMenu';

export { ChapterMenu };
