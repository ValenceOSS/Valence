import type { DiskUse } from './libraryDisks';

const ZFS_DATASET = /^([^/:\s]+)\/\S/;

/**
 * Reads the pool out of a ZFS dataset's device name, `pool/dataset`.
 *
 * @param device - The device a filesystem is on.
 * @returns The pool, or null where the device is not a dataset below a pool.
 */
const poolOf = (device: string | null): string | null =>
  device === null ? null : (ZFS_DATASET.exec(device)?.[1] ?? null);

/**
 * Names the drive a filesystem is part of. A ZFS dataset, named by the device `pool/dataset`, is
 * part of its pool, sharing the pool's room with every other dataset in it, and so is the pool's own
 * top dataset, named by the pool alone, where a dataset below it is mounted too. Anything else is a
 * drive of its own, known by where it is mounted.
 *
 * @param disks - Every filesystem the monitor knows about.
 * @param disk - The filesystem.
 * @returns The pool's name for a dataset, or the mount point for anything else.
 */
const driveKeyOf = (disks: readonly DiskUse[], disk: DiskUse): string => {
  const pool =
    poolOf(disk.device) ??
    (disks.some((one) => one.device !== null && poolOf(one.device) === disk.device)
      ? disk.device
      : null);

  return pool === null ? disk.mountPoint : `zfs:${pool}`;
};

export { driveKeyOf };
