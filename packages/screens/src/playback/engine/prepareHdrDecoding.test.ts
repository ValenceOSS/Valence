import { describe, expect, it } from 'vitest';
import { prepareHdrDecoding } from '@ValenceScreens/playback/engine/prepareHdrDecoding';
import { bytesOf } from '@ValenceScreens/playback/engine/hevc/bytesOf';
import { TONE_MAPPING_PROBES } from '@ValenceScreens/playback/engine/TONE_MAPPING_PROBES';

const UNTOUCHED = {
  primaries: 'bt709',
  transfer: 'iec61966-2-1',
  matrix: 'bt2020-ncl',
  fullRange: false,
};

describe('prepareHdrDecoding', () => {
  it('unlabels an HDR10 H.265 stream and tells the decoder the colour instead', () => {
    const probe = TONE_MAPPING_PROBES[0];
    const prepared = prepareHdrDecoding({
      codec: 'hevc',
      config: { codec: probe.config, description: bytesOf(probe.description) },
      containerColour: {},
      firstKey: bytesOf(probe.frame),
    });

    expect(prepared?.signal).toBe('pq');
    expect(prepared?.isWideGamut).toBe(true);
    expect(prepared?.config.colorSpace).toEqual(UNTOUCHED);
  });

  it('rewrites an AV1 stream’s sequence headers as it goes', () => {
    const frame = bytesOf(TONE_MAPPING_PROBES[1].frame);
    const prepared = prepareHdrDecoding({
      codec: 'av1',
      config: { codec: TONE_MAPPING_PROBES[1].config },
      containerColour: {},
      firstKey: frame,
    });

    expect(prepared?.signal).toBe('pq');
    expect(prepared?.rewrite(frame)).not.toBe(frame);
  });

  it('takes a VP9 stream’s HDR from its container, which is the only place VP9 says it', () => {
    const prepared = prepareHdrDecoding({
      codec: 'vp9',
      config: { codec: 'vp09.02.10.10' },
      containerColour: {
        primaries: 'bt2020',
        transfer: 'pq',
        matrix: 'bt2020-ncl',
        fullRange: false,
      },
      firstKey: null,
    });

    expect(prepared?.config.colorSpace).toEqual(UNTOUCHED);
    expect(prepared?.rewrite(Uint8Array.from([1]))).toEqual(Uint8Array.from([1]));
  });

  it('has nothing to prepare for a picture that is not HDR', () => {
    expect(
      prepareHdrDecoding({
        codec: 'vp9',
        config: { codec: 'vp09.00.10.08' },
        containerColour: { transfer: 'bt709' },
        firstKey: null,
      }),
    ).toBeNull();
  });
});
