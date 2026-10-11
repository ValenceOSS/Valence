import { describe, expect, it } from 'vitest';
import { unlabelHevcSps } from '@ValenceScreens/playback/engine/hevc/unlabelHevcSps';
import { readHevcColour } from '@ValenceScreens/playback/engine/hevc/readHevcColour';
import { unescapeNal } from '@ValenceScreens/playback/engine/hevc/unescapeNal';
import { bytesOf } from '@ValenceScreens/playback/engine/hevc/bytesOf';
import { PQ_SPS } from '@ValenceScreens/playback/engine/hevc/PQ_SPS';

describe('unlabelHevcSps', () => {
  it('says the colour is unspecified and reports what it said before', () => {
    const { nal, colour } = unlabelHevcSps(bytesOf(PQ_SPS));
    const after = readHevcColour(unescapeNal(nal));

    expect(colour.transfer).toBe(16);
    expect([after.primaries, after.transfer, after.matrix]).toEqual([2, 2, 2]);
  });

  it('changes nothing else in the set', () => {
    const before = unescapeNal(bytesOf(PQ_SPS));
    const after = unescapeNal(unlabelHevcSps(bytesOf(PQ_SPS)).nal);
    const differing = [...before].flatMap((byte, at) => (byte === after[at] ? [] : [at]));

    expect(after.length).toBe(before.length);
    expect(differing.every((at) => at >= 29 && at <= 32)).toBe(true);
  });
});
