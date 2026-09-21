/**
 * Names the snapshot taken before a migration runs.
 *
 * The stamp comes first so that names sort by age, and the last migration about to run is in it so
 * that somebody choosing between them can tell which release each one was taken ahead of.
 *
 * @param at - When it was taken.
 * @param lastTag - The newest migration that was about to run.
 * @returns The file name.
 */
const nameSnapshot = (at: Date, lastTag: string): string =>
  `valence-${at.toISOString().replace(/[:.]/g, '-')}-before-${lastTag}.dump`;

export { nameSnapshot };
