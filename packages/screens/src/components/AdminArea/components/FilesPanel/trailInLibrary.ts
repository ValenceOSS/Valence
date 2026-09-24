import { pathSegments } from '@ValenceScreens/components/AdminArea/components/FolderBrowser/pathSegments';
import type { PathSegment } from '@ValenceScreens/components/AdminArea/components/FolderBrowser/pathSegments';

/**
 * The folders from a library's own down to one inside it, the first named for the library rather
 * than for its folder — the trail the file manager steps back along, which never leaves a library.
 *
 * @param path - The folder being looked at.
 * @param libraryPath - The library's own folder.
 * @param libraryName - What the library is called.
 * @returns The library, then each folder on the way down, ending with the one given.
 */
const trailInLibrary = (path: string, libraryPath: string, libraryName: string): PathSegment[] => {
  const depth = pathSegments(libraryPath).length;

  return pathSegments(path)
    .slice(depth - 1)
    .map((segment, index) => (index === 0 ? { ...segment, label: libraryName } : segment));
};

export { trailInLibrary };
