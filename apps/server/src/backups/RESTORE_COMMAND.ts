/* oxlint-disable valence/no-hard-coded-strings -- a shell command, typed as it is */
const RESTORE_COMMAND =
  'docker compose run --rm --entrypoint node valence apps/server/dist/Rollback.js --restore';

export { RESTORE_COMMAND };
