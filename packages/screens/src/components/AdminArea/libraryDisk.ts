import { libraryDisks } from './libraryDisks';
import type { DiskUse } from './libraryDisks';

/**
 * Picks the one filesystem worth reporting for a set of libraries: of the disks holding any of them,
 * the one with the least room left. Libraries can be spread over several mounts, and the one about
 * to run out is the only one anybody needs telling about.
 *
 * @param disks - The filesystems the monitor knows about.
 * @param paths - Where the libraries live.
 * @returns The filesystem to report, or null where none of them can be placed on one.
 */
const libraryDisk = (disks: DiskUse[], paths: string[]): DiskUse | null =>
  libraryDisks(disks, paths)[0] ?? null;

export { libraryDisk };
export type { DiskUse };
