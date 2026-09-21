type PruneSnapshotsOptions = {
  names: readonly string[];
  keep: number;
  remove: (name: string) => Promise<void>;
};

/**
 * Deletes the oldest snapshots, keeping the newest few.
 *
 * @param names - Every snapshot, newest first.
 * @param keep - How many to leave.
 * @param remove - How to delete one.
 * @returns The names deleted.
 */
const pruneSnapshots = async ({
  names,
  keep,
  remove,
}: PruneSnapshotsOptions): Promise<readonly string[]> => {
  const doomed = names.slice(Math.max(keep, 1));

  for (const name of doomed) {
    await remove(name);
  }

  return doomed;
};

export type { PruneSnapshotsOptions };

export { pruneSnapshots };
