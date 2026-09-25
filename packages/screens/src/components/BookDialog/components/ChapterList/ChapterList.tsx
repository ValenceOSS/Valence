import { Check as CheckIcon } from '@keyline-icons/react';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import type { ChapterListProps } from './ChapterList.types';

/**
 * A book's chapters, in order: what each is called, how many pages it runs to, and how much of it
 * has been read — a line while part way, a tick once through — so somebody can see where they are
 * in a long run and open any chapter of it.
 *
 * @param chapters - The chapters to list.
 * @param read - How far through each chapter this reader is, by its id.
 * @param onOpen - Told to open a chapter in the reader.
 */
const ChapterList = ({ chapters, read, onOpen }: ChapterListProps) => (
  <ul
    aria-label={say('screens.chapterList.chapters')}
    className="flex flex-col divide-y divide-divider"
  >
    {chapters.map((chapter) => {
      const fraction = read.get(chapter.id) ?? 0;
      const isRead = fraction >= 1;

      return (
        <li key={chapter.id}>
          <Button
            variant="row"
            size="none"
            label={say('screens.chapterList.readChapter', { title: chapter.title })}
            hasTooltip={false}
            onClick={() => {
              onOpen(chapter.id);
            }}
            className="flex w-full items-center gap-4 px-2 py-3 text-left"
          >
            <span className="w-8 shrink-0 text-center text-sm tabular-nums text-text-muted">
              {Number.isInteger(chapter.number) ? chapter.number.toString() : chapter.number}
            </span>

            <span className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="truncate text-sm font-medium text-text">{chapter.title}</span>

              <span className="flex items-center gap-3 font-body text-xs text-text-muted">
                <span className="shrink-0">
                  {chapter.pageCount === null
                    ? say('screens.chapterList.reflows')
                    : sayCount('screens.chapterList.pageCount', chapter.pageCount)}
                </span>

                {fraction > 0 && !isRead ? (
                  <span
                    role="progressbar"
                    aria-label={say('screens.chapterList.howFarThrough', { title: chapter.title })}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(fraction * 100)}
                    className="h-1 w-24 overflow-hidden rounded-full bg-[var(--surface-line)]"
                  >
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${(fraction * 100).toString()}%` }}
                    />
                  </span>
                ) : null}

                {fraction > 0 && !isRead ? (
                  <span className="tabular-nums">
                    {say('screens.chapterList.percentRead', {
                      percent: Math.round(fraction * 100).toString(),
                    })}
                  </span>
                ) : null}
              </span>
            </span>

            {isRead ? (
              <span
                role="img"
                aria-label={say('screens.chapterList.isRead')}
                className="shrink-0 text-text-muted"
              >
                <Icon of={CheckIcon} size={16} />
              </span>
            ) : null}
          </Button>
        </li>
      );
    })}
  </ul>
);

ChapterList.displayName = 'ChapterList';

export { ChapterList };
