import { readdir } from 'node:fs/promises';
import { isSnapshotName } from '@ValenceServer/db/isSnapshotName';

type ListSnapshotsOptions = {
  folder: string;
  readFolder?: (folder: string) => Promise<readonly string[]>;
};

/**
 * Lists the snapshots in a folder, newest first.
 *
 * A folder that does not exist yet holds none, which is what every server that has never migrated
 * over a database looks like.
 *
 * @param folder - Where the snapshots are kept.
 * @param readFolder - How to list a folder.
 * @returns The snapshot names, newest first.
 */
const listSnapshots = async ({
  folder,
  readFolder = readdir,
}: ListSnapshotsOptions): Promise<readonly string[]> => {
  try {
    return (await readFolder(folder)).filter(isSnapshotName).toSorted().toReversed();
  } catch {
    return [];
  }
};

export type { ListSnapshotsOptions };

export { listSnapshots };
