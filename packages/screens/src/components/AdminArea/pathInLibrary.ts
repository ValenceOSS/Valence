/**
 * Writes a path as it sits inside its library, since every path in one library starts the same way
 * and saying that part on every row only pushes the part that differs out of sight.
 *
 * @param path - The file or folder.
 * @param libraryPath - Where the library is, where it is known.
 * @returns The path below the library, or the whole path where it is not inside it.
 */
const pathInLibrary = (path: string, libraryPath: string | null): string => {
  if (libraryPath === null || !path.startsWith(libraryPath)) {
    return path;
  }

  const inside = path.slice(libraryPath.length).replace(/^[\\/]+/, '');

  return inside === '' ? path : inside;
};

export { pathInLibrary };
