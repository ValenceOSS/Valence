import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { saveReadingProgress } from '@ValenceClient/books/fetchBooks';
import { whereToOpen } from '@ValenceClient/books/whereToOpen';
import { useNowReading } from '@ValenceClient/books/useNowReading';
import { useBookmarks } from '@ValenceClient/books/useBookmarks';
import { describeBookmark } from '@ValenceClient/books/describeBookmark';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { APageReader } from '@ValenceMobile/components/AReader/components/APageReader/APageReader';
import { ATextReader } from '@ValenceMobile/components/AReader/components/ATextReader/ATextReader';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AReaderProps } from './AReader.types';
import type { AReaderMarks } from './AReaderMarks';
import type { Bookmark } from '@ValenceContracts/schemas/Book';
import { say } from '@ValenceI18n/say';
import { ASpinner } from '@ValenceMobile/components/ASpinner/ASpinner';

const BOOKMARK_PICTURE_PIXELS = 160;

/**
 * Reading one book, opened where the web's reading page opens it: in the chapter somebody last read
 * and where in it they were, or at the start of the chapter they picked. A book whose text reflows
 * is read in the text reader and one of fixed pages in the page reader, and every move is written
 * back so the web, the desktop and the phone all carry on from each other.
 *
 * Each chapter is a reader of its own, so moving to the next opens it at its start rather than at
 * the page the last one was left on, and going to a bookmark opens a new reader where it points.
 * The book's bookmarks are kept here, for every chapter, on this phone and on the server. Leaving
 * asks the shelves again, so what was read shows there.
 *
 * @param bookId - Which book.
 * @param chapterId - The chapter somebody picked, or nothing to carry on.
 * @param isFromTheStart - Whether it opens at the very start, for somebody reading it again, rather
 *   than where they left off.
 * @param onBack - Told somebody is done reading.
 */
const AReader = ({ bookId, chapterId, isFromTheStart, onBack }: AReaderProps) => {
  const colours = useTheColours();
  const cache = useQueryClient();
  const asked = useQuery(bookQueries.one(bookId));
  const read = useQuery(bookQueries.progress(bookId));
  const [chosen, setChosen] = useState(chapterId);
  const [jump, setJump] = useState<{ to: Bookmark; arrival: number } | null>(null);
  const chapters = useMemo(() => asked.data?.chapters ?? [], [asked.data]);
  const opening = whereToOpen(
    chapters,
    isFromTheStart && chosen === chapterId ? [] : (read.data ?? []),
    chosen,
  );
  const open = opening.chapterId;
  const jumped = jump !== null && jump.to.chapterId === open ? jump.to : null;
  const chapterIds = useMemo(
    () =>
      [...chapters].sort((one, other) => one.number - other.number).map((chapter) => chapter.id),
    [chapters],
  );
  const { bookmarks, add, remove } = useBookmarks(bookId, chapterIds);

  const changeChapter = useCallback((to: string) => {
    setJump(null);
    setChosen(to);
  }, []);

  useEffect(
    () => () => {
      void cache.invalidateQueries({ queryKey: bookQueries.key });
    },
    [cache],
  );

  const isReading =
    asked.data !== undefined && asked.data !== null && read.data !== undefined && open !== '';
  const tellReading = useNowReading(isReading ? bookId : null);

  const rememberPage = useCallback(
    (page: number, isFinished: boolean) => {
      void saveReadingProgress(bookId, open, { pageNumber: page }, isFinished);
      tellReading({ fraction: null, pageNumber: page });
    },
    [bookId, open, tellReading],
  );

  const rememberFraction = useCallback(
    (fraction: number, isFinished: boolean) => {
      void saveReadingProgress(bookId, open, { fraction }, isFinished);
      tellReading({ fraction, pageNumber: null });
    },
    [bookId, open, tellReading],
  );

  const marks: AReaderMarks = {
    here: bookmarks.filter((bookmark) => bookmark.chapterId === open),
    all: bookmarks.map((bookmark) => {
      const described = describeBookmark(bookmark, chapters, BOOKMARK_PICTURE_PIXELS);

      return {
        ...described,
        picture: described.picture === null ? null : onThisServer(described.picture),
      };
    }),
    onMark: (place) => {
      add({ ...place, chapterId: open });
    },
    onUnmark: remove,
    onOpen: (bookmarkId) => {
      const to = bookmarks.find((bookmark) => bookmark.id === bookmarkId);

      if (to !== undefined) {
        setChosen(to.chapterId);
        setJump((was) => ({ to, arrival: (was?.arrival ?? 0) + 1 }));
      }
    },
  };
  const readerKey = `${open}:${(jumped === null ? 0 : (jump?.arrival ?? 0)).toString()}`;

  if (asked.isError) {
    return (
      <Screen centres onBack={onBack}>
        <Words tone="danger">{say('common.thatBookCouldNotBeRead')}</Words>
      </Screen>
    );
  }

  if (asked.data === undefined || asked.data === null || read.data === undefined) {
    return (
      <Screen centres onBack={onBack}>
        <ASpinner colour={colours.textMuted} />
      </Screen>
    );
  }

  if (open === '') {
    return (
      <Screen centres onBack={onBack}>
        <Words tone="muted" isCentred>
          {say('common.nothingInThisBookYetScanning')}
        </Words>
      </Screen>
    );
  }

  const ordered = [...chapters].sort((one, other) => one.number - other.number);
  const next = ordered[ordered.findIndex((chapter) => chapter.id === open) + 1] ?? null;

  return asked.data.book.layout === 'reflow' ? (
    <ATextReader
      key={readerKey}
      book={asked.data.book}
      chapterId={open}
      startAtFraction={jumped?.fraction ?? opening.startAtFraction}
      next={next}
      onChapter={changeChapter}
      onFraction={rememberFraction}
      onBack={onBack}
      marks={marks}
    />
  ) : (
    <APageReader
      key={readerKey}
      book={asked.data.book}
      chapters={chapters}
      chapterId={open}
      startAtPage={jumped?.pageNumber ?? opening.startAtPage}
      onChapter={changeChapter}
      onPage={rememberPage}
      onBack={onBack}
      marks={marks}
    />
  );
};

AReader.displayName = 'AReader';

export { AReader };
