import { unescapeNal } from './unescapeNal';

const PREFIX_SEI = 39;

const MASTERING_DISPLAY = 137;

const CONTENT_LIGHT_LEVEL = 144;

const LUMINANCE_UNITS = 10_000;

/**
 * Reads a number an SEI message writes as a run of 255s and a final byte.
 *
 * @param raw - The message's payload.
 * @param at - Where the number starts.
 * @returns The number and where it ends.
 */
const readSeiNumber = (raw: Uint8Array, at: number): { value: number; at: number } => {
  let value = 0;
  let next = at;

  while (raw[next] === 255) {
    value += 255;
    next += 1;
  }

  return { value: value + (raw[next] ?? 0), at: next + 1 };
};

/**
 * How bright an HDR film's brightest pixel is, from the SEI messages its stream carries: its content
 * light level — the brightest pixel actually in the film — where it states one, and otherwise the
 * peak of the display it was mastered on. Tone mapping rolls off from this, so a film mastered at
 * 4000 nits keeps its highlights and one that never passes 600 is not dimmed for no reason.
 *
 * @param nals - NAL units to look through, from the configuration record and the first key frame.
 * @returns The peak in nits, or nothing where the stream does not say.
 */
const readHevcPeakNits = (nals: readonly Uint8Array[]): number | null => {
  const found: { lightLevel: number | null; mastering: number | null } = {
    lightLevel: null,
    mastering: null,
  };

  for (const nal of nals) {
    if ((((nal[0] ?? 0) >> 1) & 0x3f) !== PREFIX_SEI) {
      continue;
    }

    const raw = unescapeNal(nal.subarray(2));
    let at = 0;

    while (at < raw.length && raw[at] !== 0x80) {
      const kind = readSeiNumber(raw, at);
      const size = readSeiNumber(raw, kind.at);
      const payload = raw.subarray(size.at, size.at + size.value);

      if (kind.value === CONTENT_LIGHT_LEVEL && payload.length >= 2) {
        found.lightLevel = ((payload[0] ?? 0) << 8) | (payload[1] ?? 0);
      }

      if (kind.value === MASTERING_DISPLAY && payload.length >= 20) {
        const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);

        found.mastering = view.getUint32(16) / LUMINANCE_UNITS;
      }

      at = size.at + size.value;
    }
  }

  if (found.lightLevel !== null && found.lightLevel > 0) {
    return found.lightLevel;
  }

  return found.mastering !== null && found.mastering > 0 ? found.mastering : null;
};

export { readHevcPeakNits };
