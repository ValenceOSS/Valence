import { hasWord } from '@ValenceRequests/profiles/hasWord';
import type { Release } from '@ValenceContracts/schemas/Indexer';
import type { ParsedRelease } from '@ValenceContracts/schemas/ParsedRelease';
import type { FormatCondition } from '@ValenceContracts/schemas/QualityProfile';

const GIGABYTE = 1024 ** 3;

/**
 * Whether a release is between two sizes written in gigabytes, such as `2-10`, where its size is
 * known; one end may be left out, as in `-10` or `30-`.
 *
 * @param sizeBytes - Its size, where known.
 * @param range - The sizes.
 * @returns Whether it is between them.
 */
const isWithin = (sizeBytes: number | null, range: string): boolean => {
  const bounds = /^\s*(\d+(?:\.\d+)?)?\s*-\s*(\d+(?:\.\d+)?)?\s*$/.exec(range);

  if (sizeBytes === null || bounds === null) {
    return false;
  }

  const [, lowest, highest] = bounds;

  return (
    (lowest === undefined || sizeBytes >= Number(lowest) * GIGABYTE) &&
    (highest === undefined || sizeBytes <= Number(highest) * GIGABYTE)
  );
};

/**
 * Whether a release meets one condition of a custom format, turned round where the condition is
 * negated: a word or pattern in its name, the group that put it out, its codec, an HDR format, its
 * source, its resolution, a language it says it has, or a size between two, in gigabytes.
 *
 * @param condition - The condition.
 * @param release - The release: its name and size.
 * @param parsed - What its name says.
 * @returns Whether it meets it.
 */
const matchesCondition = (
  condition: FormatCondition,
  release: Pick<Release, 'title' | 'sizeBytes'>,
  parsed: ParsedRelease,
): boolean => {
  const value = condition.value.trim().toLowerCase();
  const isMet = ((): boolean => {
    switch (condition.kind) {
      case 'words':
        return hasWord(release.title, condition.value.trim());
      case 'group':
        return parsed.group?.toLowerCase() === value;
      case 'codec':
        return parsed.codec === value;
      case 'hdr':
        return parsed.hdr.some((format) => format.toLowerCase() === value);
      case 'source':
        return parsed.source === value;
      case 'resolution':
        return parsed.resolution === value;
      case 'language':
        return parsed.languages.includes(value);
      case 'size':
        return isWithin(release.sizeBytes, value);
    }
  })();

  return condition.isNegated ? !isMet : isMet;
};

export { matchesCondition };
