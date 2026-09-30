import { Check as CheckIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { SlidingList } from '@ValenceScreens/components/SlidingList/SlidingList';
import type { ChapterListProps } from './ChapterList.types';

/**
 * A book's chapters, in order, numbered in their titles: what each is called, how many pages it runs to, and how much of it
 * has been read — a line while part way, a tick once through — so somebody can see where they are
 * in a long run and open any chapter of it.
 *
 * @param chapters - The chapters to list.
 * @param read - How far through each chapter this reader is, by its id.
 * @param onOpen - Told to open a chapter in the reader.
 */
const ChapterList = ({ chapters, read, onOpen }: ChapterListProps) => (
  <SlidingList
    label="Chapters"
    items={chapters}
    keyOf={(chapter) => chapter.id}
    renderItem={(chapter) => {
      const fraction = read.get(chapter.id) ?? 0;
      const isRead = fraction >= 1;

      return (
        <Button
          variant="bare"
          size="none"
          label={`Read ${chapter.title}`}
          hasTooltip={false}
          onClick={() => {
            onOpen(chapter.id);
          }}
          className="relative flex w-full items-center gap-4 py-3 text-left"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="truncate text-sm font-medium text-text">
              {`${chapter.number.toString()}. ${chapter.title}`}
            </span>

            <span className="flex items-center gap-3 font-body text-xs text-text-muted">
              <span className="shrink-0">
                {chapter.pageCount === null
                  ? 'Reflows to fit'
                  : `${chapter.pageCount.toString()} ${chapter.pageCount === 1 ? 'page' : 'pages'}`}
              </span>

              {fraction > 0 && !isRead ? (
                <span
                  role="progressbar"
                  aria-label={`How far through ${chapter.title}`}
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
                <span className="tabular-nums">{`${Math.round(fraction * 100).toString()}% read`}</span>
              ) : null}
            </span>
          </span>

          {isRead ? (
            <span role="img" aria-label="Read" className="shrink-0 text-text-muted">
              <Icon of={CheckIcon} size={16} />
            </span>
          ) : null}
        </Button>
      );
    }}
  />
);

ChapterList.displayName = 'ChapterList';

export { ChapterList };
