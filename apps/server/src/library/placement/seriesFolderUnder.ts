/**
 * The programme folder a folder sits in, which is the first folder below a programmes library's top
 * folder, or nothing for the top folder itself or anywhere outside it.
 *
 * @param root - The library's top folder.
 * @param folder - The folder being asked about.
 * @returns The programme folder, or null.
 */
const seriesFolderUnder = (root: string, folder: string): string | null => {
  const base = root.replace(/\/+$/, '');

  if (!folder.startsWith(`${base}/`)) {
    return null;
  }

  const [first] = folder.slice(base.length + 1).split('/');

  return first === undefined || first === '' ? null : `${base}/${first}`;
};

export { seriesFolderUnder };
