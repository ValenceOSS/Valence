import { ContentAdviceSchema } from '@ValenceContracts/schemas/Advisory';
import type { Advisory } from '@ValenceContracts/schemas/Advisory';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

const FALLBACKS = ['US', 'GB'];

/**
 * What a title contains, as the country this server reads certificates for says, or as another
 * says where that one said nothing — what a film contains does not change at a border, only how a
 * certificate weighs it.
 *
 * @param stored - The advisories kept for the title, country by country.
 * @param region - The country this server reads certificates for.
 * @returns The advisories, or null where no country said any.
 */
const adviceFor = (stored: JsonValue, region: string): Advisory[] | null => {
  const advice = ContentAdviceSchema.catch({}).parse(stored ?? {});
  const country = [region, ...FALLBACKS].find((code) => (advice[code] ?? []).length > 0);
  const said =
    country === undefined ? Object.values(advice).find((one) => one.length > 0) : advice[country];

  return said === undefined || said.length === 0 ? null : said;
};

export { adviceFor };
