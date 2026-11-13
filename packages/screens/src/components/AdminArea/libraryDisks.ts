import type { Monitor } from '@ValenceClient/admin/fetchAdmin';
import { driveKeyOf } from './driveKeyOf';
import { wholeDriveOf } from './wholeDriveOf';

type DiskUse = Monitor['resources']['disks'][number];

/**
 * Decides whether a path sits on a mount point, matching on path boundaries so that `/mnt/media2` is
 * not taken to be inside `/mnt/media`.
 *
 * @param mountPoint - The mount point.
 * @param path - The path in question.
 * @returns Whether the path is on it.
 */
const holds = (mountPoint: string, path: string): boolean => {
  if (path === mountPoint) {
    return true;
  }

  return path.startsWith(mountPoint.endsWith('/') ? mountPoint : `${mountPoint}/`);
};

/**
 * Finds every drive a set of libraries lives on, each once, the one with the least room left first.
 * Where a path sits under nested mounts, the deepest is the one it is actually on, and where that is
 * a dataset of a ZFS pool, the drive is the pool, under the mount point of the first library on it.
 *
 * @param disks - The filesystems the monitor knows about.
 * @param paths - Where the libraries live.
 * @returns The drives holding any of them, tightest first.
 */
const libraryDisks = (disks: readonly DiskUse[], paths: readonly string[]): DiskUse[] => {
  const holding = new Map<string, DiskUse>();

  for (const path of paths) {
    const deepest = disks
      .filter((disk) => holds(disk.mountPoint, path))
      .reduce<DiskUse | null>(
        (best, disk) =>
          best === null || disk.mountPoint.length > best.mountPoint.length ? disk : best,
        null,
      );

    if (deepest !== null && !holding.has(driveKeyOf(deepest))) {
      holding.set(driveKeyOf(deepest), wholeDriveOf(disks, deepest));
    }
  }

  return [...holding.values()].sort((one, other) => one.availableBytes - other.availableBytes);
};

export type { DiskUse };

export { libraryDisks };
