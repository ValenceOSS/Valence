import { tidy } from './readEpisodeFromPath';

/**
 * Names one file the way somebody watching a scan would recognise it — the file's own name, without
 * the folders above it and without its extension.
 *
 * A path is most of a screen wide and the part that says which film this is sits at the end of it,
 * so a progress line carrying the whole thing says the least useful part of it loudest.
 *
 * @param path - The file's full path.
 * @returns What to call it while it is being worked on.
 */
const nameOfFile = (path: string): string => {
  const base = path.slice(path.lastIndexOf('/') + 1);
  const lastDot = base.lastIndexOf('.');
  const named = tidy(lastDot > 0 ? base.slice(0, lastDot) : base);

  return named === '' ? base : named;
};

export { nameOfFile };
