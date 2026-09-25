/**
 * Tidies a file or folder name into something worth showing, turning separators into spaces and
 * trimming what is left.
 *
 * @param name - The name as it is on disk.
 * @returns The name as a person would write it.
 */
const tidyName = (name: string): string =>
  name
    .replace(/[[\]()_.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export { tidyName };
