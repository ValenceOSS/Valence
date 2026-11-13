import { driveKeyOf } from './driveKeyOf';
import { libraryDisks } from './libraryDisks';
import { wholeDriveOf } from './wholeDriveOf';
import type { DiskUse } from './libraryDisks';

/**
 * Finds every drive a set of libraries lives on, each once, the one with the least room left first,
 * counting the datasets of a ZFS pool as the one drive they share. A pool is named by the mount
 * point of whichever of its library datasets has the least room left. How full each library's own
 * filesystem is, which a quota can make fuller than its pool, is `libraryDisks`'s to say.
 *
 * @param disks - The filesystems the monitor knows about.
 * @param paths - Where the libraries live.
 * @returns The drives holding any of them, tightest first.
 */
const libraryDrives = (disks: readonly DiskUse[], paths: readonly string[]): DiskUse[] => {
  const drives = new Map<string, DiskUse>();

  for (const disk of libraryDisks(disks, paths)) {
    const key = driveKeyOf(disks, disk);

    if (!drives.has(key)) {
      drives.set(key, wholeDriveOf(disks, disk));
    }
  }

  return [...drives.values()].sort((one, other) => one.availableBytes - other.availableBytes);
};

export { libraryDrives };
