const SEPARATOR_RUNS = /(?<=[^\s._]{2})[._]+|[._]+(?=[^\s._]{2})/gu;

/**
 * Turns the dots or underscores a release puts between words into spaces, the way Jellyfin names a
 * programme, while leaving the dots inside initials such as `S.H.I.E.L.D` alone.
 *
 * @param name - The name as a file or folder gives it.
 * @returns It with spaces between its words.
 */
const spaceOutName = (name: string): string => name.replace(SEPARATOR_RUNS, ' ').trim();

export { spaceOutName };
