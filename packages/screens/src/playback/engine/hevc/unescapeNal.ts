/**
 * A NAL unit's payload without the emulation prevention bytes its encoder inserted — the `03` after
 * every `00 00` that would otherwise read as a start code — so its fields can be read where the
 * standard places them.
 *
 * @param nal - The NAL unit as stored.
 * @returns Its raw payload.
 */
const unescapeNal = (nal: Uint8Array): Uint8Array => {
  const out: number[] = [];
  let zeros = 0;

  for (const byte of nal) {
    if (zeros >= 2 && byte === 3) {
      zeros = 0;
      continue;
    }

    out.push(byte);
    zeros = byte === 0 ? zeros + 1 : 0;
  }

  return Uint8Array.from(out);
};

export { unescapeNal };
