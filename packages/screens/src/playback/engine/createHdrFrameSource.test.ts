import { describe, expect, it } from 'vitest';
import { createHdrFrameSource } from '@ValenceScreens/playback/engine/createHdrFrameSource';
import type { InputVideoTrack } from 'mediabunny';

const NO_PACKETS: Parameters<typeof createHdrFrameSource>[1] = {
  getKeyPacket: () => Promise.resolve(null),
  getFirstKeyPacket: () => Promise.resolve(null),
  packets: async function* () {
    await Promise.resolve();
    yield* [];
  },
};

/**
 * A picture of one codec, with no decoder configuration to read.
 *
 * @param codec - Its codec.
 * @returns The track.
 */
const aTrack = (codec: 'hevc' | 'avc'): Pick<InputVideoTrack, 'codec' | 'getDecoderConfig'> => ({
  codec,
  getDecoderConfig: () => Promise.resolve(null),
});

describe('createHdrFrameSource', () => {
  it('has nothing to offer a picture that is not H.265', async () => {
    expect(await createHdrFrameSource(aTrack('avc'), NO_PACKETS)).toBeNull();
  });

  it('has nothing to offer an H.265 picture it cannot read the configuration of', async () => {
    expect(await createHdrFrameSource(aTrack('hevc'), NO_PACKETS)).toBeNull();
  });
});
