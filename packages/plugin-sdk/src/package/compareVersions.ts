/**
 * Compares one dot-separated prerelease part with another the way semver does: numbers by value
 * and below any word, words by their characters.
 *
 * @param first - One part.
 * @param second - The other.
 * @returns Negative, nought or positive, as the first comes before, with or after the second.
 */
const compareIdentifiers = (first: string, second: string): number => {
  const firstIsNumber = /^\d+$/.test(first);
  const secondIsNumber = /^\d+$/.test(second);

  if (firstIsNumber && secondIsNumber) {
    return Number(first) - Number(second);
  }

  if (firstIsNumber !== secondIsNumber) {
    return firstIsNumber ? -1 : 1;
  }

  return first < second ? -1 : first > second ? 1 : 0;
};

/**
 * Orders two plugin versions the way semver does: by major, minor and patch, then a release above
 * any prerelease of it, and prereleases part by part.
 *
 * @param first - One version, such as 1.2.3 or 1.3.0-beta.2.
 * @param second - The other.
 * @returns Negative, nought or positive, as the first is older, the same or newer.
 */
const compareVersions = (first: string, second: string): number => {
  const [firstCore = '', ...firstRest] = first.split('-');
  const [secondCore = '', ...secondRest] = second.split('-');
  const firstNumbers = firstCore.split('.').map(Number);
  const secondNumbers = secondCore.split('.').map(Number);

  for (let at = 0; at < 3; at += 1) {
    const difference = (firstNumbers[at] ?? 0) - (secondNumbers[at] ?? 0);

    if (difference !== 0) {
      return difference;
    }
  }

  const firstPre = firstRest.join('-');
  const secondPre = secondRest.join('-');

  if (firstPre === '' || secondPre === '') {
    return (firstPre === '' ? 1 : 0) - (secondPre === '' ? 1 : 0);
  }

  const firstParts = firstPre.split('.');
  const secondParts = secondPre.split('.');

  for (let at = 0; at < Math.min(firstParts.length, secondParts.length); at += 1) {
    const difference = compareIdentifiers(firstParts[at] ?? '', secondParts[at] ?? '');

    if (difference !== 0) {
      return difference;
    }
  }

  return firstParts.length - secondParts.length;
};

export { compareVersions };
