import iconv from 'iconv-lite';

/**
 * Encodes text for a URL in the site's own character set, since a Cyrillic site that reads its query
 * in windows-1251 does not find anything searched for in UTF-8. Spaces become `+`, as a form would
 * send them.
 *
 * @param text - The text.
 * @param encoding - The site's character set.
 * @returns The encoded text.
 */
const encodeUrlText = (text: string, encoding: string): string =>
  [...(iconv.encodingExists(encoding) ? iconv.encode(text, encoding) : Buffer.from(text))]
    .map((byte) => {
      const character = String.fromCharCode(byte);

      return /[A-Za-z0-9\-_.!*()]/.test(character)
        ? character
        : byte === 0x20
          ? '+'
          : `%${byte.toString(16).toUpperCase().padStart(2, '0')}`;
    })
    .join('');

export { encodeUrlText };
