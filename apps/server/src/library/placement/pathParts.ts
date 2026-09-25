/**
 * Splits a file's path into the folder holding it, its name, and its name without the extension.
 *
 * @param path - The file's path.
 * @returns Its folder, its name and its stem.
 */
const pathParts = (path: string): { folder: string; fileName: string; stem: string } => {
  const at = path.lastIndexOf('/');
  const fileName = path.slice(at + 1);
  const dot = fileName.lastIndexOf('.');

  return {
    folder: at <= 0 ? '' : path.slice(0, at),
    fileName,
    stem: dot > 0 ? fileName.slice(0, dot) : fileName,
  };
};

export { pathParts };
