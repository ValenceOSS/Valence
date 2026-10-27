const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Turns a base32 info hash, as older magnet links carry it, into hex.
 *
 * @param text - The 32 base32 characters.
 * @returns The 40 hex characters, or null where it is not base32.
 */
const base32ToHex = (text: string): string | null => {
  let bits = '';

  for (const letter of text.toUpperCase()) {
    const value = BASE32.indexOf(letter);

    if (value === -1) {
      return null;
    }

    bits += value.toString(2).padStart(5, '0');
  }

  return (bits.match(/.{4}/g) ?? []).map((nibble) => parseInt(nibble, 2).toString(16)).join('');
};

/**
 * Reads the info hash out of a magnet link, in hex or base32, which is how a torrent client names
 * the torrent once it has it.
 *
 * @param url - The magnet link.
 * @returns The hash in lower-case hex, or null where the link carries none.
 */
const readMagnetHash = (url: string): string | null => {
  const hash = /[?&]xt=urn:btih:([a-z0-9]+)/i.exec(url)?.[1];

  if (hash === undefined) {
    return null;
  }

  if (/^[a-f0-9]{40}$/i.test(hash)) {
    return hash.toLowerCase();
  }

  return hash.length === 32 ? base32ToHex(hash) : null;
};

export { readMagnetHash };
