const HOW_TO_ROLL_BACK =
  'docker compose stop valence && docker compose run --rm --entrypoint node valence apps/server/dist/Rollback.js --list';

/**
 * Words what to do about a database a newer release has already migrated.
 *
 * @param count - How many migrations it has run that this release does not carry.
 * @returns The line to fail with.
 */
const describeNewerSchema = (count: number): string =>
  `This database has run ${count.toString()} migration${count === 1 ? '' : 's'} this release does not carry, so a newer Valence has used it. Starting an older one over it would read tables it does not understand. Either run the newer release again, or roll the database back to the snapshot taken before that upgrade: \`${HOW_TO_ROLL_BACK}\`, then \`Rollback.js --restore\`, then start this release.`;

export { HOW_TO_ROLL_BACK, describeNewerSchema };
