import { rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { Backup } from '@ValenceContracts/schemas/Backup';
import { listSnapshots } from '@ValenceServer/db/listSnapshots';
import { pruneSnapshots } from '@ValenceServer/db/pruneSnapshots';
import { detailsOfSnapshot } from './detailsOfSnapshot';
import { nameBackup } from './nameBackup';
import type { BackupService } from './BackupService';

type CreateBackupServiceOptions = {
  folder: string;
  kept: number;
  tool: string;
  restoreCommand: string;
  take: (name: string) => Promise<'taken' | 'missing'>;
  probe?: () => Promise<'ran' | 'missing'>;
  now?: () => Date;
  sizeOf?: (path: string) => Promise<number>;
  remove?: (path: string) => Promise<void>;
  readFolder?: (folder: string) => Promise<readonly string[]>;
};

/**
 * Copies of the whole database kept in the backup folder: the ones taken before each upgrade, and
 * the ones taken by hand or on the schedule, which a person can list, take, download and remove.
 *
 * Only the scheduled copies are pruned, to the number kept. A copy somebody took by hand stays until
 * somebody removes it, and the copies from before an upgrade are pruned by the upgrade.
 *
 * @param folder - Where the copies are kept.
 * @param kept - How many scheduled copies to leave, newest first.
 * @param tool - The database's dump tool, named for anybody told it is missing.
 * @param restoreCommand - What to run, with a copy's name after it, to put one back.
 * @param take - How to dump the database into the folder under a name.
 * @param probe - How to tell whether the dump tool is installed, asked once before the first list.
 * @param now - The clock.
 * @param sizeOf - How large a file is.
 * @param remove - How to delete one.
 * @param readFolder - How to list the folder.
 * @returns The backup service.
 */
const createBackupService = ({
  folder,
  kept,
  tool,
  restoreCommand,
  take,
  probe = () => Promise.resolve('ran'),
  now = () => new Date(),
  sizeOf = async (path) => (await stat(path)).size,
  remove = (path) => rm(path),
  readFolder,
}: CreateBackupServiceOptions): BackupService => {
  let isToolInstalled: boolean | null = null;

  const names = () =>
    listSnapshots({ folder, ...(readFolder === undefined ? {} : { readFolder }) });

  const describeBackup = async (name: string): Promise<Backup | null> => {
    const details = detailsOfSnapshot(name);

    if (details === null) {
      return null;
    }

    try {
      return {
        name,
        kind: details.kind,
        takenAt: details.takenAt.toISOString(),
        sizeBytes: await sizeOf(join(folder, name)),
        before: details.before,
      };
    } catch {
      return null;
    }
  };

  const fileOf = async (name: string) =>
    (await names()).includes(name) ? join(folder, name) : null;

  return {
    list: async () => {
      isToolInstalled ??= (await probe()) === 'ran';

      const backups = (await Promise.all((await names()).map(describeBackup))).filter(
        (one) => one !== null,
      );

      return {
        backups,
        folder,
        tool,
        isToolInstalled: isToolInstalled || backups.length > 0,
        kept,
        restoreCommand,
      };
    },
    take: async (kind) => {
      const name = nameBackup(now(), kind);
      const outcome = await take(name);

      isToolInstalled = outcome === 'taken';

      if (outcome === 'missing') {
        return 'missing';
      }

      if (kind === 'onSchedule') {
        await pruneSnapshots({
          names: (await names()).filter((one) => detailsOfSnapshot(one)?.kind === 'onSchedule'),
          keep: kept,
          remove: (old) => remove(join(folder, old)),
        });
      }

      const taken = await describeBackup(name);

      if (taken === null) {
        return 'missing';
      }

      return taken;
    },
    remove: async (name) => {
      const file = await fileOf(name);

      if (file === null) {
        return false;
      }

      await remove(file);

      return true;
    },
    fileOf,
  };
};

export type { CreateBackupServiceOptions };

export { createBackupService };
