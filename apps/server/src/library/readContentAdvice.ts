import { ADVISORIES } from '@ValenceContracts/schemas/Advisory';
import { advisoryOf } from '@ValenceServer/library/advisoryOf';
import type { Advisory, ContentAdvice } from '@ValenceContracts/schemas/Advisory';

/**
 * Collects what a catalogue says a film or programme contains, one list per country, from the
 * descriptors it gives beside each certificate. Read from the same answer as the certificates, so
 * it costs nothing more to ask.
 *
 * @param detail - What the catalogue answered.
 * @returns The advisories per country, in a fixed order, with countries that named none left out.
 */
const readContentAdvice = (detail: {
  release_dates?:
    | {
        results?:
          | {
              iso_3166_1: string;
              release_dates?: { descriptors?: string[] | undefined }[] | undefined;
            }[]
          | undefined;
      }
    | undefined;
  content_ratings?:
    | { results?: { iso_3166_1: string; descriptors?: string[] | undefined }[] | undefined }
    | undefined;
}): ContentAdvice => {
  const found: Record<string, Set<Advisory>> = {};

  const keep = (country: string, descriptors: readonly string[]) => {
    const said = descriptors
      .map((descriptor) => advisoryOf(descriptor))
      .filter((advisory) => advisory !== null);

    if (said.length > 0) {
      const code = country.toUpperCase();

      found[code] = new Set([...(found[code] ?? []), ...said]);
    }
  };

  for (const country of detail.content_ratings?.results ?? []) {
    keep(country.iso_3166_1, country.descriptors ?? []);
  }

  for (const country of detail.release_dates?.results ?? []) {
    keep(
      country.iso_3166_1,
      (country.release_dates ?? []).flatMap((release) => release.descriptors ?? []),
    );
  }

  return Object.fromEntries(
    Object.entries(found).map(([country, said]) => [
      country,
      ADVISORIES.filter((advisory) => said.has(advisory)),
    ]),
  );
};

export { readContentAdvice };
