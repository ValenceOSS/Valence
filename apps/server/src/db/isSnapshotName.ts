const SNAPSHOT_NAME = /^valence-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-before-.+\.dump$/;

/**
 * Says whether a file in the backup folder is one of these snapshots.
 *
 * @param name - The file name.
 * @returns Whether `nameSnapshot` could have written it.
 */
const isSnapshotName = (name: string): boolean => SNAPSHOT_NAME.test(name);

export { isSnapshotName };
