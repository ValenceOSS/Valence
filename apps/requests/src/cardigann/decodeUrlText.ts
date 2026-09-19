import iconv from 'iconv-lite';

/**
 * Decodes text taken from a URL, reading the escaped bytes in the site's own character set.
 *
 * @param text - The text, with `%` escapes and `+` for spaces.
 * @param encoding - The site's character set.
 * @returns The decoded text.
 */
const decodeUrlText = (text: string, encoding: string): string => {
  const charset = iconv.encodingExists(encoding) ? encoding : 'utf8';
  const bytes: number[] = [];

  for (let at = 0; at < text.length; at += 1) {
    const escaped = /^%([0-9a-fA-F]{2})/.exec(text.slice(at))?.[1];

    if (escaped !== undefined) {
      bytes.push(Number.parseInt(escaped, 16));
      at += 2;
    } else {
      bytes.push(...iconv.encode(text[at] === '+' ? ' ' : (text[at] ?? ''), charset));
    }
  }

  return iconv.decode(Buffer.from(bytes), charset);
};

export { decodeUrlText };
