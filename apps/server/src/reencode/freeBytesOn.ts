import type { DiskUse } from '@ValenceServer/maintenance/DiskUse';

/**
 * How much room is left on whichever disk a path lands on.
 *
 * The media service reports every mount it can see and deliberately says nothing about which of
 * them holds a library — it does not know where the libraries are, and whoever asks does. So the
 * matching happens here: the longest mount point the path begins with is the one it is on, which is
 * the same rule the kernel uses and the only one that gets nested mounts right. A library at
 * `/mnt/tank/media` under a pool at `/mnt/tank` is on the first, not the second.
 *
 * @param disks - Every mount the media service reported.
 * @param path - The file or folder being written to.
 * @returns The bytes free there, or nothing where no mount claims it.
 */
const freeBytesOn = (disks: readonly DiskUse[], path: string): number | null => {
  const holding = disks
    .filter(
      (disk) =>
        path === disk.mountPoint ||
        path.startsWith(disk.mountPoint === '/' ? '/' : `${disk.mountPoint}/`),
    )
    .sort((left, right) => right.mountPoint.length - left.mountPoint.length);

  return holding[0]?.availableBytes ?? null;
};

export { freeBytesOn };
