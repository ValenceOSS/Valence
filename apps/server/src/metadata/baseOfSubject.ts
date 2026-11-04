const PART = /:(?:s\d+(?:e\d+)?|e[^:]+)$/u;

/**
 * The key of the film or programme an edit's key belongs to: a season's or an episode's key with
 * its own part taken off, and a film's or programme's as it stands.
 *
 * @param key - The key edits are kept under.
 * @param kind - The kind of title it is.
 * @returns The film's or programme's key.
 */
const baseOfSubject = (key: string, kind: string): string =>
  kind === 'season' || kind === 'episode' ? key.replace(PART, '') : key;

export { baseOfSubject };
