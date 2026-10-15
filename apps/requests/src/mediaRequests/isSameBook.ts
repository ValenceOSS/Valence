import { audiobookTitleOf } from '@ValenceContracts/functions/audiobookTitleOf';
import { reduceTitle } from '@ValenceRequests/mediaRequests/reduceTitle';

/**
 * Whether a book a download holds, by the title its files or tags give it, is the book of that
 * title: the same words, once an audiobook's "(Unabridged)" and series number are set aside.
 *
 * @param held - The title the download gives it.
 * @param title - The book's own title.
 * @returns Whether they are one book.
 */
const isSameBook = (held: string, title: string): boolean =>
  reduceTitle(audiobookTitleOf({ title: held }) ?? held) === reduceTitle(title);

export { isSameBook };
