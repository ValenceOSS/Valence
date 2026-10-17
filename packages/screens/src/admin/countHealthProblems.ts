import type { LibraryHealth } from '@ValenceContracts/schemas/LibraryHealth';

/**
 * Counts everything wrong in the libraries, across every kind of problem.
 *
 * @param health - What is wrong, or null before it has been read.
 * @returns How many problems there are.
 */
const countHealthProblems = (health: LibraryHealth | null | undefined): number =>
  health === null || health === undefined
    ? 0
    : health.unmatched.total +
      health.noArtwork.total +
      health.duplicate.total +
      health.unreadable.total;

export { countHealthProblems };
