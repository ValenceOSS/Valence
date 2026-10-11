const METADATA = 5;

const HDR_CONTENT_LIGHT_LEVEL = 1;

const HDR_MASTERING_DISPLAY = 2;

const FIXED_POINT = 256;

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
 * How bright an AV1 HDR film's brightest pixel is, from the metadata OBUs it carries: the content
 * light level where it states one, and otherwise the peak of the display it was mastered on.
 *
 * @param obus - OBUs to look through, such as the first key frame's.
 * @returns The peak in nits, or nothing where the stream does not say.
 */
const readAv1PeakNits = (obus: Uint8Array): number | null => {
  const found: { lightLevel: number | null; mastering: number | null } = {
    lightLevel: null,
    mastering: null,
  };
  let at = 0;

  while (at < obus.length) {
    const header = obus[at] ?? 0;
    const payloadStart = at + 1 + ((header & 0x04) === 0 ? 0 : 1);
    const sized = (header & 0x02) === 0 ? null : readLeb128(obus, payloadStart);
    const start = sized?.at ?? payloadStart;
    const end = sized === null ? obus.length : start + sized.value;

    if (((header >> 3) & 0x0f) === METADATA) {
      const kind = readLeb128(obus, start);
      const view = new DataView(obus.buffer, obus.byteOffset + kind.at, Math.max(0, end - kind.at));

      if (kind.value === HDR_CONTENT_LIGHT_LEVEL && view.byteLength >= 2) {
        found.lightLevel = view.getUint16(0);
      }

      if (kind.value === HDR_MASTERING_DISPLAY && view.byteLength >= 20) {
        found.mastering = view.getUint32(16) / FIXED_POINT;
      }
    }

    at = end;
  }

  if (found.lightLevel !== null && found.lightLevel > 0) {
    return found.lightLevel;
  }

  return found.mastering !== null && found.mastering > 0 ? found.mastering : null;
};

export { readAv1PeakNits };
