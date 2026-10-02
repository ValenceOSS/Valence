/**
 * Writes a path with forward slashes and no slash at the end, so paths from a Windows source and
 * paths typed by hand can be compared.
 *
 * @param path - The path.
 * @returns The path, tidied.
 */
const tidyPath = (path: string): string => path.replace(/\\/g, '/').replace(/\/+$/, '');

export { tidyPath };
