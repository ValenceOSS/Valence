/**
 * A NAL unit's raw payload with emulation prevention bytes put back wherever two zero bytes are
 * followed by anything that could be read as a start code, so it is safe to store again.
 *
 * @param raw - The raw payload.
 * @returns The NAL unit as it may be stored.
 */
const escapeNal = (raw: Uint8Array): Uint8Array => {
  const out: number[] = [];
  let zeros = 0;

  for (const byte of raw) {
    if (zeros >= 2 && byte <= 3) {
      out.push(3);
      zeros = 0;
    }

    out.push(byte);
    zeros = byte === 0 ? zeros + 1 : 0;
  }

  return Uint8Array.from(out);
};

export { escapeNal };
