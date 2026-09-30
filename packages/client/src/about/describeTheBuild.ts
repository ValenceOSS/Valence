import { describeTheServer } from '@ValenceClient/about/describeTheServer';
import type { BuildInfo } from '@ValenceClient/platform/Platform.types';
import type { About } from '@ValenceContracts/schemas/About';
import { say } from '@ValenceI18n/say';

/**
 * Says what this build is, and what the server it is talking to runs, in the one line somebody pastes
 * into a bug report.
 *
 * Either half may be missing — a browser has no build of its own, and a client not yet pointed at a
 * server has nobody to ask — so the line is whatever of the two is known. A build that cannot say
 * which commit it came from, as a phone cannot, leaves the commit out rather than guessing.
 *
 * @param info - This client's own build, where it has one.
 * @param server - What the server says it runs, where one answered.
 * @returns The line, or nothing where neither is known.
 */
const describeTheBuild = (info: BuildInfo | null, server: About | null): string | null => {
  const parts = [
    info === null
      ? null
      : info.commit === null
        ? say('client.about.describeTheBuild.valenceVersionRunsOn', {
            version: info.version,
            runsOn: info.runsOn,
          })
        : say('client.about.describeTheBuild.valenceVersionCommitRunsOn', {
            version: info.version,
            commit: info.commit,
            runsOn: info.runsOn,
          }),
    describeTheServer(server),
  ].filter((part) => part !== null);

  return parts.length === 0 ? null : parts.join(' · ');
};

export { describeTheBuild };
