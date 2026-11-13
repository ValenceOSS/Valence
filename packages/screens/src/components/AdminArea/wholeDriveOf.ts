import { driveKeyOf } from './driveKeyOf';
import type { DiskUse } from './libraryDisks';

/**
 * Measures the whole drive a filesystem is part of. A ZFS dataset reports only what it holds itself
 * beside the room left to it, so the pool is put back together from every dataset that can be seen:
 * the pool's room left, which is the most any of them reports since a quota can hold one to less,
 * and what each holds, counted once however many places it is mounted. A pool's datasets that are
 * not mounted here cannot be seen, so the size is what is visible of it. Anything that is not part of
 * a pool is its own drive, and is returned as it is.
 *
 * @param disks - Every filesystem the monitor knows about.
 * @param disk - The filesystem.
 * @returns The drive, under the filesystem's own mount point.
 */
const wholeDriveOf = (disks: readonly DiskUse[], disk: DiskUse): DiskUse => {
  const key = driveKeyOf(disks, disk);

  if (key === disk.mountPoint) {
    return disk;
  }

  const datasets = [
    ...new Map(
      [...disks, disk]
        .filter((one) => driveKeyOf(disks, one) === key)
        .map((one) => [one.device ?? one.mountPoint, one]),
    ).values(),
  ];
  const availableBytes = Math.max(...datasets.map((one) => one.availableBytes));
  const heldBytes = datasets.reduce(
    (sum, one) => sum + Math.max(0, one.totalBytes - one.availableBytes),
    0,
  );

  return { ...disk, totalBytes: availableBytes + heldBytes, availableBytes };
};

export { wholeDriveOf };
