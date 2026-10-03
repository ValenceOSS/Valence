// oxlint-disable-next-line valence/no-hard-coded-strings -- part of a file name, matched on disk rather than read by people
const KEPT_COPY_MARK = '.valence.';

/**
 * Whether a file is a copy Valence made and keeps beside the film it came from, named as
 * `Arrival (2016) - 1080p H264.valence.mp4`. It belongs to that film by its identifier rather than
 * by being found, so the scanner never takes it for a film of its own.
 *
 * @param path - The file's path.
 * @returns Whether its name ends in the mark and one extension.
 */
const isKeptCopy = (path: string): boolean => {
  const name = path.slice(Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\')) + 1);
  const at = name.toLowerCase().lastIndexOf(KEPT_COPY_MARK);

  return at > 0 && !name.slice(at + KEPT_COPY_MARK.length).includes('.');
};

export { KEPT_COPY_MARK, isKeptCopy };
