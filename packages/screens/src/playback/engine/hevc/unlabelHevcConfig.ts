import { HEVC_SPS } from './HEVC_SPS';
import { unlabelHevcSps } from './unlabelHevcSps';
import type { HevcColour } from './readHevcColour';

const ARRAYS_AT = 22;

/**
 * An H.265 decoder configuration record (`hvcC`) with every sequence parameter set in it unlabelled,
 * and how long the NAL unit lengths in the stream's packets are, for rewriting the sets a stream
 * repeats in-band. The record is rebuilt, since a rewritten set can grow by an emulation prevention
 * byte.
 *
 * @param record - The record, as the container holds it.
 * @returns The rewritten record, the colour its first set said, and the packets' length size; or
 *   nothing where the record cannot be read.
 */
const unlabelHevcConfig = (
  record: Uint8Array,
): { record: Uint8Array; colour: HevcColour; lengthSize: number } | null => {
  if (record.length <= ARRAYS_AT) {
    return null;
  }

  const lengthSize = ((record[21] ?? 0) & 3) + 1;
  const out: number[] = [...record.subarray(0, ARRAYS_AT + 1)];
  const said: { colour: HevcColour | null } = { colour: null };
  let at = ARRAYS_AT + 1;

  for (let array = 0; array < (record[ARRAYS_AT] ?? 0); array += 1) {
    const kind = (record[at] ?? 0) & 0x3f;
    const count = ((record[at + 1] ?? 0) << 8) | (record[at + 2] ?? 0);

    out.push(record[at] ?? 0, record[at + 1] ?? 0, record[at + 2] ?? 0);
    at += 3;

    for (let unit = 0; unit < count; unit += 1) {
      const length = ((record[at] ?? 0) << 8) | (record[at + 1] ?? 0);
      const nal = record.subarray(at + 2, at + 2 + length);

      if (nal.length !== length) {
        return null;
      }

      const written = kind === HEVC_SPS ? unlabelHevcSps(nal) : null;

      said.colour ??= written?.colour ?? null;

      const kept = written?.nal ?? nal;

      out.push(kept.length >> 8, kept.length & 0xff, ...kept);
      at += 2 + length;
    }
  }

  return said.colour === null
    ? null
    : { record: Uint8Array.from(out), colour: said.colour, lengthSize };
};

export { unlabelHevcConfig };
