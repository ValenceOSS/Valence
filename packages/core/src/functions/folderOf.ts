/**
 * The folder a file sits in, read from its path whichever way its separators lean.
 *
 * @param path - The file.
 * @returns Its folder, or the path itself where it names no folder.
 */
const folderOf = (path: string): string => {
  const cut = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));

  return cut <= 0 ? path : path.slice(0, cut);
};

export { folderOf };
