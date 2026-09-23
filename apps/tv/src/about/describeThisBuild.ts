import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { z } from 'zod';

const BuildSchema = z.object({ build: z.object({ version: z.string(), commit: z.string() }) });

/**
 * What this build of Valence is and what the server answering it is running, on one line, the way
 * the desktop app signs its account dialog: the release and the commit it was cut from, the
 * television's own system, and the server's commit, for whoever is about to paste it into a bug
 * report. A client and the server it talks to are not always cut from the same commit.
 *
 * @param serverCommit - The commit the server says it runs, where it has said.
 * @returns The line, naming only what is known.
 */
const describeThisBuild = (serverCommit: string | null): string => {
  const read = BuildSchema.safeParse(Constants.expoConfig?.extra);
  const parts = [
    read.success ? `Valence ${read.data.build.version} (${read.data.build.commit})` : null,
    `tvOS ${String(Platform.Version)}`,
    serverCommit === null ? null : `Server ${serverCommit}`,
  ].filter((part) => part !== null);

  return parts.join(' · ');
};

export { describeThisBuild };
