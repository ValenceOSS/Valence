import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@ValenceUI/Spinner';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { BookText } from '@ValenceScreens/components/BookText/BookText';
import type { ScrollingPartProps } from './ScrollingPart.types';
import { say } from '@ValenceI18n/say';

/**
 * One part of a book as it runs on down the page in the scrolling reader, read when it is first
 * drawn and marked with which part it is, so the reader can tell how far through somebody is.
 *
 * @param bookId - The book.
 * @param chapterId - The file its text is in.
 * @param part - Which part this is.
 * @param onFollow - Told when a link within the book is followed.
 */
const ScrollingPart = ({ bookId, chapterId, part, onFollow }: ScrollingPartProps) => {
  const text = useQuery(bookQueries.document(bookId, chapterId, part));

  return (
    <section data-part={part} className="min-h-24 pb-[2.4em]">
      {text.data === undefined ? (
        <Spinner isCentered size="sm" label={say('common.openingTheBook')} />
      ) : (
        <BookText html={text.data ?? ''} onFollow={onFollow} />
      )}
    </section>
  );
};

ScrollingPart.displayName = 'ScrollingPart';

export { ScrollingPart };
