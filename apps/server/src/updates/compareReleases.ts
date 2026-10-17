const PARTS = /^v?(\d+)\.(\d+)\.(\d+)/;

/**
 * Compares two release numbers such as `1.6.0` and `v1.7.2`, ignoring anything after the third
 * number, so a development build reads as the release it was made from.
 *
 * @param a - One release.
 * @param b - The other.
 * @returns Below zero where `a` is older, above zero where it is newer, zero where they are the same
 *   release or either cannot be read.
 */
const compareReleases = (a: string, b: string): number => {
  const left = PARTS.exec(a.trim());
  const right = PARTS.exec(b.trim());

  if (left === null || right === null) {
    return 0;
  }

  for (const index of [1, 2, 3]) {
    const difference = Number(left[index]) - Number(right[index]);

    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
};

export { compareReleases };
