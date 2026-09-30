import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { z } from 'zod';
import { describeTheServer } from '@ValenceClient/about/describeTheServer';
import type { About } from '@ValenceContracts/schemas/About';
import { say } from '@ValenceI18n/say';

const BuildSchema = z.object({ build: z.object({ version: z.string(), commit: z.string() }) });

/**
 * What this build of Valence is and what the server answering it is running, on one line, the way
 * the desktop app signs its account dialog: the release and the commit it was cut from, the
 * television's own system, and the server's release and commit, for whoever is about to paste it
 * into a bug report. A client and the server it talks to are not always cut from the same commit.
 *
 * @param server - What the server says it runs, where it has said.
 * @returns The line, naming only what is known.
 */
const describeThisBuild = (server: About | null): string => {
  const read = BuildSchema.safeParse(Constants.expoConfig?.extra);
  const parts = [
    read.success
      ? say('tv.about.describeThisBuild.valenceVersionCommit', {
          version: read.data.build.version,
          commit: read.data.build.commit,
        })
      : null,
    `tvOS ${String(Platform.Version)}`,
    describeTheServer(server),
  ].filter((part) => part !== null);

  return parts.join(' · ');
};

export { describeThisBuild };
