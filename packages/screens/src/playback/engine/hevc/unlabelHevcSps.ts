import { escapeNal } from './escapeNal';
import { readHevcColour } from './readHevcColour';
import { unescapeNal } from './unescapeNal';
import type { HevcColour } from './readHevcColour';

const UNSPECIFIED = 2;

/**
 * An H.265 sequence parameter set with its colour primaries, transfer and matrix rewritten to
 * unspecified, so the decoder takes the colour it is configured with instead — which is how the
 * picture reaches WebGPU as the encoded HDR signal rather than already converted, in eight bits, by
 * the browser. Everything else in the set is left exactly as it was.
 *
 * @param nal - The parameter set as stored.
 * @returns The rewritten set, and the colour it said before, or the set as it was where it said
 *   nothing about colour.
 */
const unlabelHevcSps = (nal: Uint8Array): { nal: Uint8Array; colour: HevcColour } => {
  const raw = unescapeNal(nal);
  const colour = readHevcColour(raw);

  if (colour.colourBitAt === null) {
    return { nal, colour };
  }

  for (let field = 0; field < 3; field += 1) {
    const start = colour.colourBitAt + field * 8;

    for (let bit = 0; bit < 8; bit += 1) {
      const at = start + bit;
      const mask = 1 << (7 - (at & 7));
      const value = (UNSPECIFIED >> (7 - bit)) & 1;
      const byte = raw[at >> 3] ?? 0;

      raw[at >> 3] = value === 1 ? byte | mask : byte & ~mask;
    }
  }

  return { nal: escapeNal(raw), colour };
};

export { unlabelHevcSps };
