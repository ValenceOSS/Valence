import { STREAMED_PREFIX } from './STREAMED_PREFIX';

/**
 * The path a streamed film is kept under in place of a file: the same for a film whichever source
 * plays it, so it keeps one place in everybody's history.
 *
 * @param tmdbId - The film's id in the catalogue.
 * @returns The path.
 */
const streamedPathOf = (tmdbId: number): string => `${STREAMED_PREFIX}${tmdbId.toString()}`;

export { streamedPathOf };
