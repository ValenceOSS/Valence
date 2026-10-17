/* oxlint-disable valence/no-hard-coded-strings -- shell commands, typed as they are */
const DOCKER_COMMANDS = {
  stop: 'docker compose stop valence',
  start: 'docker compose up -d',
  pull: 'docker compose pull',
} as const;

export { DOCKER_COMMANDS };
