import { encodeUrlText } from '@ValenceRequests/cardigann/encodeUrlText';

type FormPair = { key: string; value: string; isEncoded: boolean };

/**
 * Writes form pairs as a query string or a form body, in the site's own character set. A pair that
 * came from a `$raw` input is already encoded and goes in as it is.
 *
 * @param pairs - The pairs, in order.
 * @param encoding - The site's character set.
 * @returns The encoded pairs joined by `&`.
 */
const encodeForm = (pairs: readonly FormPair[], encoding: string): string =>
  pairs
    .map(({ key, value, isEncoded }) =>
      isEncoded
        ? `${key}=${value}`
        : `${encodeUrlText(key, encoding)}=${encodeUrlText(value, encoding)}`,
    )
    .join('&');

export type { FormPair };

export { encodeForm };
