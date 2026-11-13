import type { DiskUse } from './libraryDisks';

const ZFS_DATASET = /^([^/:\s]+)\/\S/;

/**
 * Names the drive a filesystem is part of. A ZFS dataset, named by the device `pool/dataset`, is
 * part of its pool, sharing the pool's room with every other dataset in it; anything else is a drive
 * of its own, known by where it is mounted.
 *
 * @param disk - The filesystem.
 * @returns The pool's name for a dataset, or the mount point for anything else.
 */
const driveKeyOf = (disk: DiskUse): string => {
  const pool = disk.device === null ? null : ZFS_DATASET.exec(disk.device);

  return pool?.[1] === undefined ? disk.mountPoint : `zfs:${pool[1]}`;
};

export { driveKeyOf };
