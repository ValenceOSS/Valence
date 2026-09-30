import type { BookPageProps } from './BookPage.types';

/**
 * One page of the book open in the reader, laid out as the reader lays out a page: the chapter and
 * the book's name along the top, the words set in the book face, and the page's number at its foot.
 * It fills whatever room it is given, so a curl can lay it where the page lies.
 *
 * @param lines - The words on the page.
 * @param number - Which page of the book it is.
 */
const BookPage = ({ lines, number }: BookPageProps) => (
  <span className="flex h-full w-full flex-col gap-3 rounded-r-lg bg-surface-raised px-5 pb-3 pt-4">
    <span className="flex items-baseline justify-between">
      <span className="text-xs uppercase tracking-[0.16em] text-text-muted">Chapter 7</span>
      <span className="text-xs text-text-muted">The Salt Road</span>
    </span>

    <span className="flex-1 font-serif text-[0.8125rem] leading-relaxed text-text">
      {lines.join(' ')}
    </span>

    <span className="self-center text-[0.6875rem] tabular-nums text-text-muted">
      {number.toString()}
    </span>
  </span>
);

BookPage.displayName = 'BookPage';

export { BookPage };
