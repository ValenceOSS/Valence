import { BookOpen as BookOpenIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { describeReadingPlace } from '@ValenceClient/books/describeReadingPlace';
import { readingFractionOf } from '@ValenceClient/books/readingFractionOf';
import { say } from '@ValenceI18n/say';
import type { ReadingHeroProps } from './ReadingHero.types';

/**
 * The book somebody read last, set out large at the head of the Books page: its cover standing
 * like a book on a table, who wrote it, where they got to and how far through that is, and one
 * button to carry on from there.
 *
 * @param reading - Where they are in the book.
 * @param onOpen - Told to open the book.
 */
const ReadingHero = ({ reading, onOpen }: ReadingHeroProps) => {
  const { book } = reading;
  const fraction = readingFractionOf(reading);

  return (
    <section
      aria-label={say('common.continueReading')}
      className="valence-card-shell flex flex-col gap-6 p-5 sm:flex-row sm:items-end sm:gap-8 sm:p-7"
    >
      <img
        src={bookCoverUrl(book.id)}
        alt=""
        className="aspect-[2/3] w-32 shrink-0 rounded-md object-cover shadow-[var(--shadow-overlay)] sm:w-40"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-text-muted">
          {say('screens.readingHero.youAreReading')}
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-[-0.01em] text-balance text-text sm:text-3xl">
            {book.title}
          </h2>
          {book.authors === null || book.authors.length === 0 ? null : (
            <p className="truncate text-base text-text-muted">{book.authors.join(', ')}</p>
          )}
        </div>

        <div className="flex max-w-md flex-col gap-1.5">
          <ProgressBar label={describeReadingPlace(reading)} value={fraction * 100} isThin />
          <span className="text-sm tabular-nums text-text-muted">
            {describeReadingPlace(reading)}
          </span>
        </div>

        <div>
          <Button
            variant="confirm"
            size="lg"
            onClick={() => {
              onOpen(book);
            }}
          >
            {say('common.continueReading')}
            <Icon of={BookOpenIcon} size={16} />
          </Button>
        </div>
      </div>
    </section>
  );
};

ReadingHero.displayName = 'ReadingHero';

export { ReadingHero };
