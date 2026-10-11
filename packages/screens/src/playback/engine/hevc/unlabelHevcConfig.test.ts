import { describe, expect, it } from 'vitest';
import { unlabelHevcConfig } from '@ValenceScreens/playback/engine/hevc/unlabelHevcConfig';
import { bytesOf } from '@ValenceScreens/playback/engine/hevc/bytesOf';
import { PQ_SPS } from '@ValenceScreens/playback/engine/hevc/PQ_SPS';

/**
 * A configuration record holding one sequence parameter set, with four-byte NAL lengths.
 *
 * @param sps - The set.
 * @returns The record.
 */
const aRecord = (sps: Uint8Array): Uint8Array =>
  Uint8Array.from([
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

describe('unlabelHevcConfig', () => {
  it('unlabels the sequence in the record and says what it was and how long packet lengths are', () => {
    const unlabelled = unlabelHevcConfig(aRecord(bytesOf(PQ_SPS)));

    expect(unlabelled?.colour.transfer).toBe(16);
    expect(unlabelled?.lengthSize).toBe(4);
    expect(unlabelHevcConfig(unlabelled?.record ?? new Uint8Array())?.colour.transfer).toBe(2);
  });

  it('cannot read a record too short to hold anything', () => {
    expect(unlabelHevcConfig(new Uint8Array(10))).toBeNull();
  });
});
