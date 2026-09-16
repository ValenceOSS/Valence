import { certificationAge } from '@ValenceCore/functions/certificationAge';

/**
 * The age an item is certificated for, in the region this server reads certificates in.
 *
 * One place, used both when a scan first stores a certificate and when the whole library is read
 * again after somebody changes the region — so the two can never disagree about what a certificate
 * means.
 *
 * Answers with nothing where the catalogue gave no certificate for that region, which is the whole
 * of the unrated case. It is not a guess and it is not a zero: an item nobody has certificated is a
 * different thing from one certificated for everybody, and the ceiling decides between them.
 *
 * @param region - The country whose certificates this server reads.
 * @param certificates - Every certificate the catalogue held, by country.
 * @returns The age, or nothing where this region never certificated it.
 */
const certificationAgeOf = (
  region: string,
  certificates: Record<string, string> | null,
): number | null => {
  const said = certificates?.[region.trim().toUpperCase()];

  return said === undefined ? null : certificationAge(region, said);
};

export { certificationAgeOf };
