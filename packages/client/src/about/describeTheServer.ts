import type { About } from '@ValenceContracts/schemas/About';
import { say } from '@ValenceI18n/say';

/**
 * Names the release and commit a server says it runs, as the half of a build line that is about the
 * server rather than the app.
 *
 * A server older than this question answers with a commit alone, and one started somewhere it could
 * not read its own commit says `unknown`; each is left out rather than printed, so a line never reads
 * "Server unknown".
 *
 * @param about - What the server said, where it has said anything.
 * @returns The phrase, or nothing where the server said nothing worth repeating.
 */
const describeTheServer = (about: About | null): string | null => {
  if (about === null) {
    return null;
  }

  const commit = about.commit === '' || about.commit === 'unknown' ? null : about.commit;

  if (about.version === undefined) {
    return commit === null ? null : say('client.about.describeTheServer.serverCommit', { commit });
  }

  return commit === null
    ? say('client.about.describeTheServer.serverVersion', { version: about.version })
    : say('client.about.describeTheServer.serverVersionCommit', { version: about.version, commit });
};

export { describeTheServer };
