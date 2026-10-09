import { matchesCondition } from '@ValenceRequests/profiles/matchesCondition';
import type { Release } from '@ValenceContracts/schemas/Indexer';
import type { ParsedRelease } from '@ValenceContracts/schemas/ParsedRelease';
import type { CustomFormat } from '@ValenceContracts/schemas/QualityProfile';

/**
 * The custom formats a release matches, and their scores together, as Sonarr counts them: a format
 * matches where every condition it requires is met, and at least one of the rest, where it has any.
 *
 * @param release - The release: its name and size.
 * @param parsed - What its name says.
 * @param formats - The profile's custom formats.
 * @returns The formats matched, and their total.
 */
const formatScoreOf = (
  release: Pick<Release, 'title' | 'sizeBytes'>,
  parsed: ParsedRelease,
  formats: readonly CustomFormat[],
): { score: number; matched: CustomFormat[] } => {
  const matched = formats.filter((format) => {
    const required = format.conditions.filter((condition) => condition.isRequired);
    const optional = format.conditions.filter((condition) => !condition.isRequired);

    return (
      required.every((condition) => matchesCondition(condition, release, parsed)) &&
      (optional.length === 0 ||
        optional.some((condition) => matchesCondition(condition, release, parsed)))
    );
  });

  return { score: matched.reduce((total, format) => total + format.score, 0), matched };
};

export { formatScoreOf };
