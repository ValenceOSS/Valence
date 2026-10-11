import { describe, expect, it } from 'vitest';
import { nalsOfRecord } from '@ValenceScreens/playback/engine/hevc/nalsOfRecord';
import { bytesOf } from '@ValenceScreens/playback/engine/hevc/bytesOf';
import { PQ_SPS } from '@ValenceScreens/playback/engine/hevc/PQ_SPS';

describe('nalsOfRecord', () => {
  it('lists every NAL unit the configuration record carries', () => {
    const sps = bytesOf(PQ_SPS);
    const record = Uint8Array.from([
      ...Array.from({ length: 21 }, () => 0),
      0xff,
      1,
      0x80 | 33,
      0,
      1,
      sps.length >> 8,
      sps.length & 0xff,
      ...sps,
    ]);

    expect(nalsOfRecord(record).map((nal) => [...nal])).toEqual([[...sps]]);
  });

  it('lists nothing for a record with no arrays', () => {
    expect(nalsOfRecord(new Uint8Array(23))).toEqual([]);
  });
});
