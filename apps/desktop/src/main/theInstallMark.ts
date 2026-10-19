import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type InstallMark = {
  leave: (version: string) => void;
  take: () => string | null;
};

/**
 * Leaves word for the next launch that this one quit to install an update, and picks it up there.
 *
 * The process that downloads an update is not the one that finds out whether it installed: the
 * installer runs between the two with neither of them alive. A file beside this client's others is
 * the only thing that crosses that gap, so the version quitting writes down what it is installing
 * and the version starting reads it, once, and removes it.
 *
 * @param folder - Where this client keeps its files.
 * @returns The way to leave the mark before quitting, and the way to take it on the way up.
 */
const theInstallMark = (folder: string): InstallMark => {
  const file = join(folder, 'installing');

  return {
    leave: (version) => {
      writeFileSync(file, version);
    },
    take: () => {
      try {
        const version = readFileSync(file, 'utf8').trim();

        rmSync(file, { force: true });

        return version === '' ? null : version;
      } catch {
        return null;
      }
    },
  };
};

export type { InstallMark };

export { theInstallMark };
