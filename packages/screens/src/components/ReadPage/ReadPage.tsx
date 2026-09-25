import { useCallback, useMemo, useState } from 'react';
import { isAudiobookFormat } from '@ValenceContracts/schemas/Book';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@ValenceUI/Spinner';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { saveReadingProgress } from '@ValenceClient/books/fetchBooks';
import { whereToOpen } from '@ValenceClient/books/whereToOpen';
import { PageReader } from '@ValenceScreens/components/PageReader/PageReader';
import { TextReader } from '@ValenceScreens/components/TextReader/TextReader';
import { say } from '@ValenceI18n/say';

/**
 * Reading one book.
 *
 * Which chapter opens is where somebody left off, and where in it is the page they were on. A shelf
 * somebody returns to should carry on rather than start again, and the alternative — always opening
 * at chapter one, page one — makes a thirty-eight volume series unusable after the first evening.
 *
 * A book whose text reflows opens in the text reader, at the fraction of the way through it somebody
 * had reached; one of fixed pages opens in the page reader.
 *
 * The reader is given the chapter as its key, so moving to another chapter is a new reader rather
 * than the same one told to move. A reader that kept its place across that would open the next
 * chapter on page ninety.
 */
const ReadPage = () => {
  const { bookId } = useParams({ strict: false });
  const go = useNavigate();
  const id = bookId ?? '';

  const asked = useQuery(bookQueries.one(id));
  const read = useQuery(bookQueries.progress(id));
  const { chapter: fromTheAddress } = useSearch({ strict: false });
  const [chosen, setChosen] = useState<string | null>(fromTheAddress ?? null);

  const chapters = useMemo(
    () => (asked.data?.chapters ?? []).filter((chapter) => !isAudiobookFormat(chapter.format)),
    [asked.data],
  );
  const { chapterId, startAtPage, startAtFraction } = whereToOpen(
    chapters,
    read.data ?? [],
    chosen,
  );

  const remember = useCallback(
    (page: number, isFinished: boolean) => {
      void saveReadingProgress(id, chapterId, { pageNumber: page }, isFinished);
    },
    [chapterId, id],
  );

  const rememberFraction = useCallback(
    (fraction: number, isFinished: boolean) => {
      void saveReadingProgress(id, chapterId, { fraction }, isFinished);
    },
    [chapterId, id],
  );

  const close = useCallback(() => {
    void go({ to: '/read' });
  }, [go]);

  if (asked.isError) {
    return (
      <CouldNotRead
        what={say('screens.readPage.thatBook')}
        isTryingAgain={asked.isFetching}
        onTryAgain={() => {
          void asked.refetch();
        }}
      />
    );
  }

  if (asked.data === undefined || asked.data === null || read.data === undefined) {
    return (
      <div className="flex h-dvh items-center justify-center bg-shade">
        <Spinner label={say('screens.readPage.opening')} />
      </div>
    );
  }

  if (chapterId === '') {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-2 bg-shade text-center">
        <p className="text-lg font-medium text-on-scrim">{say('screens.readPage.emptyTitle')}</p>
        <p className="text-sm text-on-scrim/70">{say('screens.readPage.emptyBody')}</p>
      </div>
    );
  }

  if (asked.data.book.layout === 'reflow') {
    return (
      <TextReader
        key={chapterId}
        book={asked.data.book}
        chapterId={chapterId}
        startAt={startAtFraction}
        onPlaceChange={rememberFraction}
        onClose={close}
      />
    );
  }

  return (
    <PageReader
      key={chapterId}
      book={asked.data.book}
      chapters={chapters}
      chapterId={chapterId}
      startAtPage={startAtPage}
      onChapterChange={setChosen}
      onPageChange={remember}
      onClose={close}
    />
  );
};

ReadPage.displayName = 'ReadPage';

export { ReadPage };
