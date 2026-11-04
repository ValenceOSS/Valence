import type { MediaTitle } from './MediaTitle.types';

/**
 * Whether a row stands for a single file: a film, an episode or one version of either, with no
 * versions of its own beneath it.
 *
 * @param title - The row.
 * @returns Whether it is one file.
 */
const isOneFile = (title: MediaTitle): boolean =>
  (title.kind === 'film' || title.kind === 'episode' || title.kind === 'version') &&
  title.parts.length === 0;

export { isOneFile };
