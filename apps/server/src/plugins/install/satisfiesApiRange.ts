/**
 * Reads a version as its three numbers, filling any it leaves out with nought.
 *
 * @param version - Such as 1, 1.2 or 1.2.3.
 * @returns The numbers, or nothing where it is not a version.
 */
const numbersOf = (version: string): [number, number, number] | null => {
  const parts = version.split('-')[0]?.split('.') ?? [];

  if (parts.length === 0 || parts.length > 3 || parts.some((part) => !/^\d+$/.test(part))) {
    return null;
  }

  const [major = 0, minor = 0, patch = 0] = parts.map(Number);

  return [major, minor, patch];
};

/**
 * Compares two versions by their numbers.
 *
 * @param first - One version.
 * @param second - The other.
 * @returns Negative, nought or positive, as the first is lower, the same or higher.
 */
const compare = (first: readonly number[], second: readonly number[]): number =>
  first.reduce((found, part, at) => (found !== 0 ? found : part - (second[at] ?? 0)), 0);

/**
 * Whether the plugin API this server offers is one a plugin says it works with. The range is the
 * same small language package managers use: a caret allows anything with the same major version, a
 * tilde anything with the same minor, and a bare version only itself.
 *
 * @param range - What the plugin asked for, such as ^1.0.
 * @param version - The API this server offers.
 * @returns Whether they meet.
 */
const satisfiesApiRange = (range: string, version: string): boolean => {
  const offered = numbersOf(version);
  const wanted = numbersOf(range.replace(/^[\^~]/, ''));

  if (offered === null || wanted === null || compare(offered, wanted) < 0) {
    return false;
  }

  if (range.startsWith('^')) {
    return offered[0] === wanted[0];
  }

  if (range.startsWith('~')) {
    return offered[0] === wanted[0] && offered[1] === wanted[1];
  }

  return compare(offered, wanted) === 0;
};

export { satisfiesApiRange };
