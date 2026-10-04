/**
 * Reads a single `Range` header against a file's length, the way the media service always has, so a
 * file served from either place answers the same request with the same bytes: one range only, a
 * missing end meaning the end of the file, and a missing start meaning that many bytes from the end.
 *
 * @param header - The header's value.
 * @param length - How many bytes the file holds.
 * @returns The first and last byte to send, or null where the whole file should be sent instead.
 */
const parseByteRange = (header: string, length: number): { start: number; end: number } | null => {
  const spec = header.startsWith('bytes=') ? header.slice('bytes='.length) : null;

  if (length === 0 || spec === null || spec.includes(',')) {
    return null;
  }

  const [from = '', to = ''] = spec.split('-', 2).map((part) => part.trim());
  const isWhole = (text: string) => /^[0-9]+$/u.test(text);

  if (from === '' && to === '') {
    return null;
  }

  if (from === '') {
    return isWhole(to) ? { start: length - Math.min(Number(to), length), end: length - 1 } : null;
  }

  if (!isWhole(from) || (to !== '' && !isWhole(to))) {
    return null;
  }

  const start = Number(from);
  const end = to === '' ? length - 1 : Math.min(Number(to), length - 1);

  return start > end || start >= length ? null : { start, end };
};

export { parseByteRange };
