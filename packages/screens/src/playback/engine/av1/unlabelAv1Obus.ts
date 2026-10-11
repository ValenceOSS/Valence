import { readAv1Colour } from './readAv1Colour';
import type { Av1Colour } from './readAv1Colour';

const SEQUENCE_HEADER = 1;

const UNSPECIFIED = 2;

/**
 * Reads a size as AV1 writes it, seven bits a byte, least significant first.
 *
 * @param bytes - Where it is.
 * @param at - Where it starts.
 * @returns The size and where it ends.
 */
const readLeb128 = (bytes: Uint8Array, at: number): { value: number; at: number } => {
  let value = 0;
  let next = at;

  for (let shift = 0; shift < 56; shift += 7) {
    const byte = bytes[next] ?? 0;

    value += (byte & 0x7f) * 2 ** shift;
    next += 1;

    if ((byte & 0x80) === 0) {
      break;
    }
  }

  return { value, at: next };
};

/**
 * A run of AV1 OBUs — a temporal unit, or the configuration OBUs of an `av1C` record — with the
 * colour primaries, transfer and matrix of every sequence header in it rewritten to unspecified, so
 * the decoder takes the colour it is configured with instead. The fields are a byte each and AV1
 * has no emulation prevention, so they are rewritten in place and nothing moves. A run without a
 * sequence header is handed back as it is, without a copy.
 *
 * @param obus - The OBUs.
 * @returns The rewritten OBUs, and the colour the first sequence header said, where there was one.
 */
const unlabelAv1Obus = (obus: Uint8Array): { obus: Uint8Array; colour: Av1Colour | null } => {
  const found: { copy: Uint8Array | null; colour: Av1Colour | null } = { copy: null, colour: null };
  let at = 0;

  while (at < obus.length) {
    const header = obus[at] ?? 0;
    const type = (header >> 3) & 0x0f;
    const payloadStart = at + 1 + ((header & 0x04) === 0 ? 0 : 1);
    const sized = (header & 0x02) === 0 ? null : readLeb128(obus, payloadStart);
    const start = sized?.at ?? payloadStart;
    const end = sized === null ? obus.length : start + sized.value;

    if (type === SEQUENCE_HEADER) {
      const colour = readAv1Colour(obus.subarray(start, end));

      found.colour ??= colour;

      if (colour.colourBitAt !== null) {
        found.copy ??= Uint8Array.from(obus);

        for (let field = 0; field < 3; field += 1) {
          for (let bit = 0; bit < 8; bit += 1) {
            const position = start * 8 + colour.colourBitAt + field * 8 + bit;
            const mask = 1 << (7 - (position & 7));
            const byte = found.copy[position >> 3] ?? 0;

            found.copy[position >> 3] =
              ((UNSPECIFIED >> (7 - bit)) & 1) === 1 ? byte | mask : byte & ~mask;
          }
        }
      }
    }

    at = end;
  }

  return { obus: found.copy ?? obus, colour: found.colour };
};

export { unlabelAv1Obus };
