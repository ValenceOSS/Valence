import { HEVC_SPS } from './HEVC_SPS';
import { unlabelHevcSps } from './unlabelHevcSps';

/**
 * An H.265 packet with any sequence parameter set it repeats in-band unlabelled as the configuration
 * record's were, since a decoder that meets one takes its colour from it. A packet without one is
 * handed back as it is, without a copy.
 *
 * @param packet - The packet's NAL units, each preceded by its length.
 * @param lengthSize - How many bytes each length takes.
 * @returns The packet to decode.
 */
const unlabelHevcPacket = (packet: Uint8Array, lengthSize: number): Uint8Array => {
  const units: Uint8Array[] = [];
  let changed = false;
  let at = 0;

  while (at + lengthSize <= packet.length) {
    let length = 0;

    for (let byte = 0; byte < lengthSize; byte += 1) {
      length = length * 256 + (packet[at + byte] ?? 0);
    }

    const nal = packet.subarray(at + lengthSize, at + lengthSize + length);
    const isSps = (((nal[0] ?? 0) >> 1) & 0x3f) === HEVC_SPS;
    const kept = isSps ? unlabelHevcSps(nal).nal : nal;

    changed ||= isSps;
    units.push(kept);
    at += lengthSize + length;
  }

  if (!changed) {
    return packet;
  }

  const out = new Uint8Array(units.reduce((sum, unit) => sum + lengthSize + unit.length, 0));
  let written = 0;

  for (const unit of units) {
    for (let byte = lengthSize - 1; byte >= 0; byte -= 1) {
      out[written + byte] = (unit.length >> ((lengthSize - 1 - byte) * 8)) & 0xff;
    }

    out.set(unit, written + lengthSize);
    written += lengthSize + unit.length;
  }

  return out;
};

export { unlabelHevcPacket };
