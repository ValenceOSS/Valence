const DECODED = new Set(['gzip', 'x-gzip', 'deflate', 'br', 'zstd']);

const MOST_CODINGS = 5;

/**
 * Whether undici's fetch undoes an answer's content coding before handing on its body, which it
 * does only where it knows every coding listed.
 *
 * @param contentEncoding - The answer's content-encoding header, if it has one.
 * @returns Whether the body arrives decoded, so the header and its length no longer describe it.
 */
const isDecodedByFetch = (contentEncoding: string | null): boolean => {
  const codings = (contentEncoding ?? '')
    .toLowerCase()
    .split(',')
    .map((coding) => coding.trim())
    .filter((coding) => coding !== '');

  return (
    codings.length > 0 &&
    codings.length <= MOST_CODINGS &&
    codings.every((coding) => DECODED.has(coding))
  );
};

export { isDecodedByFetch };
