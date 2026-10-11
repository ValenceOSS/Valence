import { describe, expect, it } from 'vitest';
import { nalsOfPacket } from '@ValenceScreens/playback/engine/hevc/nalsOfPacket';

describe('nalsOfPacket', () => {
  it('cuts a packet into the NAL units its lengths mark out', () => {
    const packet = Uint8Array.from([0, 0, 0, 2, 0x40, 0x01, 0, 0, 0, 3, 0x26, 0x01, 0xaf]);

    expect(nalsOfPacket(packet, 4).map((nal) => [...nal])).toEqual([
      [0x40, 0x01],
      [0x26, 0x01, 0xaf],
    ]);
  });

  it('reads two-byte lengths too', () => {
    expect(nalsOfPacket(Uint8Array.from([0, 1, 0x4e]), 2).map((nal) => [...nal])).toEqual([[0x4e]]);
  });
});
