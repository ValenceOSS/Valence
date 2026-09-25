import { say } from '@ValenceI18n/say';
import { Icon } from '@ValenceUI/Icon';
import { Bin as BinIcon, Check as CheckIcon } from '@keyline-icons/react';
import { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { Badge } from '@ValenceUI/Badge';
import { Spinner } from '@ValenceUI/Spinner';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { forgetViewing, forgetHistory } from '@ValenceClient/history/fetchHistory';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { forgetReading } from '@ValenceClient/books/fetchBooks';
import { describeWhen } from '@ValenceClient/history/describeWhen';
import { interleaveHistory } from '@ValenceClient/history/interleaveHistory';
import { describeReadingPlace } from '@ValenceClient/books/describeReadingPlace';
import type { BookReading } from '@ValenceContracts/schemas/Book';
import type { Viewing } from '@ValenceContracts/schemas/Viewing';
import type { HistoryPanelProps } from './HistoryPanel.types';
import type { InfiniteData } from '@tanstack/react-query';
import { STATUS_LOOK } from '@ValenceClient/status/STATUS_LOOK';

/**
 * Names something in the history that has since left the library, since a viewing outlives the file
 * it was of — the alternative is a row saying nothing at all.
 *
 * @param viewing - The viewing as recorded.
 * @returns What to call it.
 */
const nameOf = (viewing: Viewing): string =>
  viewing.title ?? say('screens.historyPanel.goneFromLibrary');

/**
 * What this profile has watched and read, most recent first, with each entry removable, since a
 * history somebody cannot edit is a history they will not want. A book appears once, at the last
 * time it was opened, with how far into it somebody got.
 *
 * @param now - What to treat as now, so the grouping can be tested.
 */
const HistoryPanel = ({ now }: HistoryPanelProps) => {
  const [isClearing, setIsClearing] = useState(false);
  const prefersReducedMotion = useReducedMotionConfig();
  const cache = useQueryClient();

  const asked = useInfiniteQuery(viewingQueries.history());
  const reading = useQuery(bookQueries.reading());

  const viewings = useMemo(() => (asked.data?.pages ?? []).flat(), [asked.data]);
  const isReading = asked.isPending || reading.isPending;
  const hasMore = asked.hasNextPage;
  const entries = useMemo(
    () => interleaveHistory(viewings, reading.data ?? [], hasMore),
    [hasMore, reading.data, viewings],
  );

  const readMore = async () => {
    await asked.fetchNextPage();
  };

  const forgetOne = async (viewingId: string) => {
    cache.setQueryData(
      viewingQueries.history().queryKey,
      (held: InfiniteData<Viewing[]> | undefined) =>
        held === undefined
          ? held
          : {
              ...held,
              pages: held.pages.map((page) => page.filter((one) => one.id !== viewingId)),
            },
    );

    if (!(await forgetViewing(viewingId))) {
      await cache.invalidateQueries({ queryKey: viewingQueries.history().queryKey });
    }
  };

  const forgetABook = async (bookId: string) => {
    cache.setQueryData(bookQueries.reading().queryKey, (held: BookReading[] | undefined) =>
      held?.filter((one) => one.book.id !== bookId),
    );

    if (!(await forgetReading(bookId))) {
      await cache.invalidateQueries({ queryKey: bookQueries.reading().queryKey });
    }
  };

  const forgetTheLot = async () => {
    setIsClearing(true);
    await Promise.all([forgetHistory(), forgetReading()]);
    await cache.invalidateQueries({ queryKey: viewingQueries.history().queryKey });
    await cache.invalidateQueries({ queryKey: bookQueries.reading().queryKey });
    setIsClearing(false);
  };

  if (isReading) {
    return <Spinner isCentered label={say('screens.historyPanel.loading')} />;
  }

  if (entries.length === 0) {
    return <p className="p-4 text-sm text-text-muted">{say('screens.historyPanel.empty')}</p>;
  }

  return (
    <div className="flex flex-col">
      <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
        <AnimatePresence initial={false} mode="popLayout">
          {entries.map((entry) => {
            const name =
              entry.kind === 'viewing' ? nameOf(entry.viewing) : entry.reading.book.title;
            const isFinished =
              entry.kind === 'viewing' ? entry.viewing.isFinished : entry.reading.isFinished;

            return (
              <motion.li
                key={entry.kind === 'viewing' ? entry.viewing.id : `book-${entry.reading.book.id}`}
                layout={!(prefersReducedMotion ?? false)}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: prefersReducedMotion === true ? 0 : 0.18 }}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm text-text-strong">{name}</span>

                  <span className="text-xs text-text-muted">
                    {entry.kind === 'viewing'
                      ? entry.viewing.seriesTitle === null
                        ? say('screens.historyPanel.viewing', {
                            when: describeWhen(entry.at, now ?? new Date()),
                            duration: formatDuration(entry.viewing.secondsWatched),
                          })
                        : say('screens.historyPanel.episodeViewing', {
                            series: entry.viewing.seriesTitle,
                            when: describeWhen(entry.at, now ?? new Date()),
                            duration: formatDuration(entry.viewing.secondsWatched),
                          })
                      : say('screens.historyPanel.reading', {
                          when: describeWhen(entry.at, now ?? new Date()),
                          place: describeReadingPlace(entry.reading),
                        })}
                  </span>
                </div>

                {isFinished ? (
                  <Badge tone={STATUS_LOOK.done.tone}>
                    <Icon of={CheckIcon} size={12} />
                    {say('screens.historyPanel.finished')}
                  </Badge>
                ) : null}

                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto shrink-0"
                  aria-label={say('screens.historyPanel.forgetOne', { name })}
                  onClick={() => {
                    void (entry.kind === 'viewing'
                      ? forgetOne(entry.viewing.id)
                      : forgetABook(entry.reading.book.id));
                  }}
                >
                  <Icon of={BinIcon} size={16} />
                </Button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--surface-line)] p-4">
        {hasMore ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              void readMore();
            }}
          >
            {say('screens.historyPanel.showMore')}
          </Button>
        ) : (
          <p className="text-xs text-text-muted">{say('screens.historyPanel.keptFor')}</p>
        )}

        <Button
          variant="ghost"
          size="sm"
          disabled={isClearing}
          className="ml-auto"
          onClick={() => {
            void forgetTheLot();
          }}
        >
          <Icon of={BinIcon} size={16} />
          {say('screens.historyPanel.forgetAll')}
        </Button>
      </div>
    </div>
  );
};

HistoryPanel.displayName = 'HistoryPanel';

export { HistoryPanel };
