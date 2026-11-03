import type { LibraryHealth } from '@ValenceContracts/schemas/LibraryHealth';

/**
 * Counts the titles in the libraries with something wrong, each once, or every problem where the
 * server's answer predates counting titles.
 *
 * @param health - What is wrong, or null before it has been read.
 * @returns How many titles need a look.
 */
const countHealthProblems = (health: LibraryHealth | null | undefined): number =>
  health === null || health === undefined
    ? 0
    : (health.titles ??
      health.unmatched.total +
        health.noArtwork.total +
        health.duplicate.total +
        health.unreadable.total);

export { countHealthProblems };
