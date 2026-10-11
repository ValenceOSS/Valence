import { describe, expect, it } from 'vitest';
import { unlabelHevcPacket } from '@ValenceScreens/playback/engine/hevc/unlabelHevcPacket';
import { unlabelHevcSps } from '@ValenceScreens/playback/engine/hevc/unlabelHevcSps';
import { bytesOf } from '@ValenceScreens/playback/engine/hevc/bytesOf';
import { PQ_SPS } from '@ValenceScreens/playback/engine/hevc/PQ_SPS';

/**
 * A packet of NAL units, each preceded by a four-byte length.
 *
 * @param units - The units.
 * @returns The packet.
 */
const aPacket = (...units: Uint8Array[]): Uint8Array =>
  Uint8Array.from(units.flatMap((unit) => [0, 0, unit.length >> 8, unit.length & 0xff, ...unit]));

describe('unlabelHevcPacket', () => {
  it('unlabels a sequence parameter set repeated in the packet and keeps the rest', () => {
    const slice = Uint8Array.from([0x26, 0x01, 0xaf]);
    const packet = aPacket(bytesOf(PQ_SPS), slice);

    expect([...unlabelHevcPacket(packet, 4)]).toEqual([
      ...aPacket(unlabelHevcSps(bytesOf(PQ_SPS)).nal, slice),
    ]);
  });

  it('hands back a packet with no parameter set as it was', () => {
    const packet = aPacket(Uint8Array.from([0x26, 0x01, 0xaf]));

    expect(unlabelHevcPacket(packet, 4)).toBe(packet);
  });
});
