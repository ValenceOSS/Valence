type ReleaseDates = {
  results?:
    | {
        iso_3166_1: string;
        release_dates?: { certification?: string | undefined }[] | undefined;
      }[]
    | undefined;
};

type ContentRatings = {
  results?:
    | {
        iso_3166_1: string;
        rating?: string | undefined;
      }[]
    | undefined;
};

/**
 * Collects every certificate a catalogue holds for something, one per country.
 *
 * Films and programmes are certificated differently and the catalogue answers differently for each:
 * a film carries a release per country and each release may name a certificate, while a programme
 * carries one rating per country. Both are read here so the rest of the server sees one shape.
 *
 * Every country is kept rather than only the one this server cares about. They arrive in the same
 * response, so keeping them costs nothing, and it means a household that moves from British
 * certificates to German ones changes a setting rather than rescanning its whole library.
 *
 * Where a country lists several releases — a cinema certificate and a different one for the disc —
 * the first that names anything wins, since the catalogue orders them and a certificate is better
 * than none.
 *
 * @param detail - What the catalogue answered, however it chose to answer it.
 * @returns The certificate per country, with countries that named none left out.
 */
const readCertifications = (detail: {
  release_dates?: ReleaseDates | undefined;
  content_ratings?: ContentRatings | undefined;
}): Record<string, string> => {
  const found: Record<string, string> = {};

  for (const country of detail.content_ratings?.results ?? []) {
    const said = country.rating?.trim() ?? '';

    if (said !== '') {
      found[country.iso_3166_1.toUpperCase()] = said;
    }
  }

  for (const country of detail.release_dates?.results ?? []) {
    const said = (country.release_dates ?? [])
      .map((release) => release.certification?.trim() ?? '')
      .find((certification) => certification !== '');

    if (said !== undefined) {
      found[country.iso_3166_1.toUpperCase()] = said;
    }
  }

  return found;
};

export type { ContentRatings, ReleaseDates };

export { readCertifications };
