import { readFileSync } from 'node:fs';

/**
 * Reads one of the recorded answers a Jellyfin, Emby or Plex server gives, kept beside the importer
 * for its tests.
 *
 * @param name - The file's name in the fixtures folder.
 * @returns The answer, as the server sent it.
 */
const readFixture = (name: string): string =>
  readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

export { readFixture };
