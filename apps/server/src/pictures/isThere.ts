import { stat } from 'node:fs/promises';

/**
 * Whether a file is there.
 *
 * @param path - Where to look.
 * @returns Whether it is.
 */
const isThere = (path: string): Promise<boolean> =>
  stat(path).then(
    () => true,
    () => false,
  );

export { isThere };
