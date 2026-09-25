import { pathParts } from './pathParts';

const RESOLUTION = /[0-9]{2}[0-9]+[ip]/iu;

const NUMERIC = new Intl.Collator('en', { numeric: true, sensitivity: 'variant' });

/**
 * Orders the versions of one film or episode the way Jellyfin does: the ones naming a resolution
 * first, highest first, then the rest by name.
 *
 * @param paths - The files that are versions of one thing.
 * @returns Them in order, the one to treat as the thing itself first.
 */
const inVersionOrder = (paths: readonly string[]): string[] => {
  const resolutionOf = (path: string): string | null =>
    RESOLUTION.exec(pathParts(path).stem)?.[0] ?? null;
  const named = paths.filter((path) => resolutionOf(path) !== null);
  const plain = paths.filter((path) => resolutionOf(path) === null);

  return [
    ...named.sort(
      (left, right) =>
        NUMERIC.compare(resolutionOf(right) ?? '', resolutionOf(left) ?? '') ||
        NUMERIC.compare(pathParts(left).stem, pathParts(right).stem),
    ),
    ...plain.sort((left, right) => NUMERIC.compare(pathParts(left).stem, pathParts(right).stem)),
  ];
};

export { inVersionOrder };
