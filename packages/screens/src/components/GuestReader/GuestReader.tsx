import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Spinner } from '@ValenceUI/Spinner';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { PageReader } from '@ValenceScreens/components/PageReader/PageReader';
import { TextReader } from '@ValenceScreens/components/TextReader/TextReader';
import { readGuestPlace, writeGuestPlace } from '@ValenceScreens/reading/guestPlace';
import type { GuestReaderProps } from './GuestReader.types';

/**
 * A shared book, read by somebody holding the link rather than signed in.
 *
 * It is the same reader a household uses — text that reflows, or pages — opened where this guest
 * last left off on this device, and it keeps their place there rather than on the server, which has
 * nobody to keep it for.
 *
 * @param book - The book that was shared.
 * @param onClose - Told to leave the reader.
 */
const GuestReader = ({ book, onClose }: GuestReaderProps) => {
  const asked = useQuery(bookQueries.one(book.id));
  const [opened] = useState(() => readGuestPlace(book.id));
  const [chosen, setChosen] = useState<string | null>(null);
  const chapters = asked.data?.chapters ?? [];
  const chapterId = chosen ?? opened?.chapterId ?? chapters[0]?.id ?? '';

  const rememberFraction = useCallback(
    (fraction: number) => {
      writeGuestPlace(book.id, { chapterId, pageNumber: null, fraction });
    },
    [book.id, chapterId],
  );

  const rememberPage = useCallback(
    (page: number) => {
      writeGuestPlace(book.id, { chapterId, pageNumber: page, fraction: null });
    },
    [book.id, chapterId],
  );

  if (asked.isError) {
    return (
      <CouldNotRead
        what="That book"
        isTryingAgain={asked.isFetching}
        onTryAgain={() => {
          void asked.refetch();
        }}
      />
    );
  }

  if (asked.data === undefined || asked.data === null || chapterId === '') {
    return (
      <div className="flex h-dvh items-center justify-center bg-shade">
        <Spinner label="Opening the book" />
      </div>
    );
  }

  const isWhereTheyLeft = chosen === null && opened?.chapterId === chapterId;

  return book.layout === 'reflow' ? (
    <TextReader
      key={chapterId}
      book={asked.data.book}
      chapterId={chapterId}
      startAt={isWhereTheyLeft ? (opened.fraction ?? 0) : 0}
      onPlaceChange={rememberFraction}
      onClose={onClose}
    />
  ) : (
    <PageReader
      key={chapterId}
      book={asked.data.book}
      chapters={chapters}
      chapterId={chapterId}
      startAtPage={isWhereTheyLeft ? (opened.pageNumber ?? 0) : 0}
      onChapterChange={setChosen}
      onPageChange={rememberPage}
      onClose={onClose}
    />
  );
};

GuestReader.displayName = 'GuestReader';

export { GuestReader };
