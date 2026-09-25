import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator } from 'react-native';
import { saveReadingProgress } from '@ValenceClient/books/fetchBooks';
import { whereToOpen } from '@ValenceClient/books/whereToOpen';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { APageReader } from '@ValenceMobile/components/AReader/components/APageReader/APageReader';
import { ATextReader } from '@ValenceMobile/components/AReader/components/ATextReader/ATextReader';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AReaderProps } from './AReader.types';

/**
 * Reading one book, opened where the web's reading page opens it: in the chapter somebody last read
 * and where in it they were, or at the start of the chapter they picked. A book whose text reflows
 * is read in the text reader and one of fixed pages in the page reader, and every move is written
 * back so the web, the desktop and the phone all carry on from each other.
 *
 * Each chapter is a reader of its own, so moving to the next opens it at its start rather than at
 * the page the last one was left on. Leaving asks the shelves again, so what was read shows there.
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
  const chapters = useMemo(() => asked.data?.chapters ?? [], [asked.data]);
  const opening = whereToOpen(
    chapters,
    isFromTheStart && chosen === chapterId ? [] : (read.data ?? []),
    chosen,
  );
  const open = opening.chapterId;

  useEffect(
    () => () => {
      void cache.invalidateQueries({ queryKey: bookQueries.key });
    },
    [cache],
  );

  const rememberPage = useCallback(
    (page: number, isFinished: boolean) => {
      void saveReadingProgress(bookId, open, { pageNumber: page }, isFinished);
    },
    [bookId, open],
  );

  const rememberFraction = useCallback(
    (fraction: number, isFinished: boolean) => {
      void saveReadingProgress(bookId, open, { fraction }, isFinished);
    },
    [bookId, open],
  );

  if (asked.isError) {
    return (
      <Screen centres onBack={onBack}>
        <Words tone="danger">That book could not be read.</Words>
      </Screen>
    );
  }

  if (asked.data === undefined || asked.data === null || read.data === undefined) {
    return (
      <Screen centres onBack={onBack}>
        <ActivityIndicator color={colours.textMuted} />
      </Screen>
    );
  }

  if (open === '') {
    return (
      <Screen centres onBack={onBack}>
        <Words tone="muted" isCentred>
          Nothing in this book yet. Scanning the library again may find it.
        </Words>
      </Screen>
    );
  }

  const ordered = [...chapters].sort((one, other) => one.number - other.number);
  const next = ordered[ordered.findIndex((chapter) => chapter.id === open) + 1] ?? null;

  return asked.data.book.layout === 'reflow' ? (
    <ATextReader
      key={open}
      book={asked.data.book}
      chapterId={open}
      startAtFraction={opening.startAtFraction}
      next={next}
      onChapter={setChosen}
      onFraction={rememberFraction}
      onBack={onBack}
    />
  ) : (
    <APageReader
      key={open}
      book={asked.data.book}
      chapters={chapters}
      chapterId={open}
      startAtPage={opening.startAtPage}
      onChapter={setChosen}
      onPage={rememberPage}
      onBack={onBack}
    />
  );
};

AReader.displayName = 'AReader';

export { AReader };
