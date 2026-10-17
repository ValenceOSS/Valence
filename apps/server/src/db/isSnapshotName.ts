import { SNAPSHOT_SUFFIX } from '#dialect/SNAPSHOT_SUFFIX';

const SNAPSHOT_NAME = new RegExp(
  `^valence-\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}-\\d{3}Z-(?:before-.+|by-hand|on-schedule)${SNAPSHOT_SUFFIX.replaceAll('.', '\\.')}$`,
);

/**
 * Says whether a file in the backup folder is one of these snapshots, taken by this database before
 * an upgrade, by hand or on a schedule.
 *
 * @param name - The file name.
 * @returns Whether `nameSnapshot` or `nameBackup` could have written it.
 */
const isSnapshotName = (name: string): boolean => SNAPSHOT_NAME.test(name);

export { isSnapshotName };
