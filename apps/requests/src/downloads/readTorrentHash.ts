import { createHash } from 'node:crypto';

const COLON = 0x3a;
const END = 0x65;
const ZERO = 0x30;
const NINE = 0x39;

/**
 * Where the bencoded value starting at a position ends, or null where it is not one.
 *
 * @param bytes - The whole file.
 * @param at - Where the value starts.
 * @returns The position just past it.
 */
const endOf = (bytes: Uint8Array, at: number): number | null => {
  const first = bytes[at];

  if (first === undefined) {
    return null;
  }

  if (first === 0x69) {
    const end = bytes.indexOf(END, at);

    return end === -1 ? null : end + 1;
  }

  if (first === 0x6c || first === 0x64) {
    let next = at + 1;

    while (bytes[next] !== END) {
      if (next >= bytes.length) {
        return null;
      }

      const after = endOf(bytes, next);

      if (after === null) {
        return null;
      }

      next = after;
    }

    return next + 1;
  }

  if (first >= ZERO && first <= NINE) {
    const colon = bytes.indexOf(COLON, at);

    if (colon === -1) {
      return null;
    }

    const length = Number(new TextDecoder().decode(bytes.subarray(at, colon)));
    const end = colon + 1 + length;

    return Number.isInteger(length) && end <= bytes.length ? end : null;
  }

  return null;
};

/**
 * Reads a torrent file's info hash — the SHA-1 of its bencoded `info` dictionary, byte for byte as
 * the file has it — which is how a torrent client names the torrent once it has it.
 *
 * @param bytes - The .torrent file.
 * @returns The hash in lower-case hex, or null where the file is not a torrent.
 */
const readTorrentHash = (bytes: Uint8Array): string | null => {
  if (bytes[0] !== 0x64) {
    return null;
  }

  let at = 1;

  while (at < bytes.length && bytes[at] !== END) {
    const keyEnd = endOf(bytes, at);

    if (keyEnd === null) {
      return null;
    }

    const key = new TextDecoder().decode(bytes.subarray(bytes.indexOf(COLON, at) + 1, keyEnd));
    const valueEnd = endOf(bytes, keyEnd);

    if (valueEnd === null) {
      return null;
    }

    if (key === 'info') {
      return createHash('sha1').update(bytes.subarray(keyEnd, valueEnd)).digest('hex');
    }

    at = valueEnd;
  }

  return null;
};

export { readTorrentHash };
