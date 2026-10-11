/**
 * Every NAL unit in an H.265 packet whose units are each preceded by their length.
 *
 * @param packet - The packet.
 * @param lengthSize - How many bytes each length takes.
 * @returns Its NAL units.
 */
const nalsOfPacket = (packet: Uint8Array, lengthSize: number): Uint8Array[] => {
  const units: Uint8Array[] = [];
  let at = 0;

  while (at + lengthSize <= packet.length) {
    let length = 0;

    for (let byte = 0; byte < lengthSize; byte += 1) {
      length = length * 256 + (packet[at + byte] ?? 0);
    }

    units.push(packet.subarray(at + lengthSize, at + lengthSize + length));
    at += lengthSize + length;
  }

  return units;
};

export { nalsOfPacket };
