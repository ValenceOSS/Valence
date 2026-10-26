import type { ListeningFiles } from '@ValenceClient/platform/Platform.types';

/**
 * What a client that cannot keep a file answers when asked to keep music or an audiobook.
 *
 * @returns Somewhere no song or book is kept.
 */
const noListeningFilesAreKept = (): ListeningFiles => ({
  fetch: () => Promise.resolve({ bytes: 0, isComplete: false, failure: null }),
  stop: () => Promise.resolve(),
  drop: () => Promise.resolve(),
  has: () => Promise.resolve(false),
  addressOf: () => '',
  canPlay: () => false,
});

export { noListeningFilesAreKept };
