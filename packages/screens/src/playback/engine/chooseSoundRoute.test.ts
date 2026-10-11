import { describe, expect, it, vi } from 'vitest';
import { chooseSoundRoute } from '@ValenceScreens/playback/engine/chooseSoundRoute';

const canEncodeAudio =
  vi.fn<(codec: string, options: { numberOfChannels: number }) => Promise<boolean>>();

vi.mock('mediabunny', () => ({
  canEncodeAudio: (codec: string, options: { numberOfChannels: number }) =>
    canEncodeAudio(codec, options),
}));

/**
 * A sound track of one codec and channel count.
 *
 * @param codec - Its codec string.
 * @param channels - How many channels it has.
 * @returns The track.
 */
const aTrack = (codec: string, channels: number) => ({
  getCodecParameterString: () => Promise.resolve(codec),
  getNumberOfChannels: () => Promise.resolve(channels),
});

describe('chooseSoundRoute', () => {
  it('carries a sound the element plays as it is', async () => {
    expect(await chooseSoundRoute(aTrack('ec-3', 8), () => true)).toEqual({
      kind: 'carried',
      parameter: 'ec-3',
    });
  });

  it('keeps every channel where an encoder can take that many', async () => {
    canEncodeAudio.mockImplementation((codec) => Promise.resolve(codec === 'aac'));

    expect(
      await chooseSoundRoute(aTrack('mlpa', 8), (mimeType) => !mimeType.includes('mlpa')),
    ).toEqual({ kind: 'encoded', codec: 'aac', parameter: 'mp4a.40.2', numberOfChannels: 8 });
  });

  it('falls back to stereo Opus where nothing can encode the channels it has', async () => {
    canEncodeAudio.mockResolvedValue(false);

    expect(
      await chooseSoundRoute(aTrack('dtsc', 6), (mimeType) => mimeType.includes('opus')),
    ).toEqual({ kind: 'encoded', codec: 'opus', parameter: 'opus', numberOfChannels: 2 });
  });
});
