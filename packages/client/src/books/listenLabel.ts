import type { ListeningProgress } from '@ValenceContracts/schemas/Book';

/**
 * What the button that starts a book playing says: to listen, to carry on where somebody left off,
 * or to hear it again once they have finished it.
 *
 * @param place - Where the watching profile had got to in the book, where they have started it.
 * @returns The words.
 */
const listenLabel = (place: ListeningProgress | null | undefined): string =>
  place === null || place === undefined
    ? 'Listen'
    : place.isFinished
      ? 'Listen again'
      : 'Continue listening';

export { listenLabel };
