import { describe, expect, it } from 'vitest';
import { unlabelAv1Obus } from '@ValenceScreens/playback/engine/av1/unlabelAv1Obus';
import { bytesOf } from '@ValenceScreens/playback/engine/hevc/bytesOf';
import { TONE_MAPPING_PROBES } from '@ValenceScreens/playback/engine/TONE_MAPPING_PROBES';

describe('unlabelAv1Obus', () => {
  it('says the sequence header’s colour is unspecified, in place, and reports what it said', () => {
    const frame = bytesOf(TONE_MAPPING_PROBES[1].frame);
    const unlabelled = unlabelAv1Obus(frame);

    expect(unlabelled.colour?.transfer).toBe(16);
    expect(unlabelled.obus.length).toBe(frame.length);
    expect(unlabelAv1Obus(unlabelled.obus).colour).toMatchObject({
      primaries: 2,
      transfer: 2,
      matrix: 2,
    });
  });

  it('hands back a run without a sequence header as it was', () => {
    const delimiter = Uint8Array.from([0x12, 0x00]);
    const unlabelled = unlabelAv1Obus(delimiter);

    expect(unlabelled.obus).toBe(delimiter);
    expect(unlabelled.colour).toBeNull();
  });
});
