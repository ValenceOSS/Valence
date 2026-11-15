const DECODED = new Set(['gzip', 'x-gzip', 'deflate', 'br', 'zstd']);

const MOST_CODINGS = 5;

/**
 * Whether undici's fetch undoes the content coding of an answer that has a body, which it does
 * only where it knows every coding listed, an empty one between commas included.
 *
 * @param contentEncoding - The answer's content-encoding header, if it has one.
 * @returns Whether the body arrives decoded, so the header and its length no longer describe it.
 */
const isDecodedByFetch = (contentEncoding: string | null): boolean => {
  if (contentEncoding === null || contentEncoding === '') {
    return false;
  }

  const codings = contentEncoding
    .toLowerCase()
    .split(',')
    .map((coding) => coding.trim());

  return codings.length <= MOST_CODINGS && codings.every((coding) => DECODED.has(coding));
};

export { isDecodedByFetch };
