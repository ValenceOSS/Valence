import type { ScanEntry } from '@ValenceScreens/components/AdminArea/scanCoordinator';

/**
 * Everything being done to a library right now, reading it or drawing its previews and thumbnails,
 * so a row can say the library is busy however it is busy.
 *
 * @param progress - Every piece of work being followed.
 * @param libraryId - The library the row is for.
 * @returns The work, which is empty where the library is idle.
 */
const workOf = (progress: ReadonlyMap<string, ScanEntry>, libraryId: string): ScanEntry[] =>
  [...progress.values()].filter((entry) => entry.libraryId === libraryId);

export { workOf };
