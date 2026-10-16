import { Switch } from '@ValenceUI/Switch';
import { PanelCard } from '@ValenceUI/PanelCard';
import { BookFormats } from '@ValenceScreens/components/AdminArea/components/TitlePage/components/BookFormats/BookFormats';
import type { SeriesBook } from '@ValenceContracts/schemas/MediaRequest';
import type { SeriesBookListProps } from './SeriesBookList.types';
import { say } from '@ValenceI18n/say';

/**
 * A book series on its page: one row for each of its books, in order, with a block for its ebook
 * and one for each part of its audiobook; then the companions between them, under "Also in this
 * world", each with a switch to fetch it too; and switches for fetching new books as they come out
 * and keeping one narrator across the series.
 *
 * @param request - The series request, with its books and what it waits for of each.
 * @param isBusy - Whether a change is being sent.
 * @param onFollowCompanion - Told to fetch a companion, or not.
 * @param onKeepsOneNarrator - Told whether the series keeps one narrator.
 * @param onFollowsNew - Told whether new books are fetched as they come out.
 */
const SeriesBookList = ({
  request,
  isBusy,
  onFollowCompanion,
  onKeepsOneNarrator,
  onFollowsNew,
}: SeriesBookListProps) => {
  const books = request.books ?? [];
  const row = (book: SeriesBook, isCompanion: boolean) => {
    const asked = request.items.filter((item) => item.title === book.title);
    const isFollowed = (request.companionsWanted ?? []).includes(book.asin);

    return (
      <li key={book.asin} className="flex flex-col gap-2 py-3 pl-5 pr-3">
        <span className="flex flex-wrap items-center gap-3">
          <span className="w-10 shrink-0 text-sm tabular-nums text-text-muted">
            {book.position ?? ''}
          </span>
          <span className="flex-1 truncate text-sm font-medium text-text">{book.title}</span>
          {book.openLibraryId === null ? (
            <span className="text-xs text-text-muted">
              {say('screens.adminArea.titlePage.seriesBookList.openLibraryDoesNotKnowIt')}
            </span>
          ) : null}
          {isCompanion && book.openLibraryId !== null ? (
            <Switch
              label={say('screens.adminArea.titlePage.seriesBookList.fetchTitleToo', {
                title: book.title,
              })}
              isLabelHidden
              isOn={isFollowed}
              disabled={isBusy}
              onToggle={() => {
                onFollowCompanion(book.asin, !isFollowed);
              }}
            />
          ) : null}
        </span>
        {asked.length === 0 ? null : (
          <span className="pl-13">
            <BookFormats items={asked} approval={request.approval} narrations={book.narrations} />
          </span>
        )}
      </li>
    );
  };
  const companions = books.filter((book) => book.isCompanion);

  return (
    <PanelCard
      title={say('common.books')}
      isFlush
      actions={
        <span className="flex flex-wrap items-center gap-4">
          <Switch
            label={say('screens.adminArea.titlePage.seriesBookList.getNewBooks')}
            isOn={request.followsNewSeasons}
            disabled={isBusy}
            onToggle={() => {
              onFollowsNew(!request.followsNewSeasons);
            }}
          />
          <Switch
            label={say('screens.adminArea.titlePage.seriesBookList.keepOneNarrator')}
            isOn={request.keepsOneNarrator ?? false}
            disabled={isBusy}
            onToggle={() => {
              onKeepsOneNarrator(!(request.keepsOneNarrator ?? false));
            }}
          />
        </span>
      }
    >
      <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
        {books.filter((book) => !book.isCompanion).map((book) => row(book, false))}
      </ul>
      {companions.length === 0 ? null : (
        <>
          <span className="block border-t border-[var(--surface-line)] px-5 pt-4 text-sm font-medium text-text-muted">
            {say('screens.adminArea.titlePage.seriesBookList.alsoInThisWorld')}
          </span>
          <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
            {companions.map((book) => row(book, true))}
          </ul>
        </>
      )}
    </PanelCard>
  );
};

SeriesBookList.displayName = 'SeriesBookList';

export { SeriesBookList };
