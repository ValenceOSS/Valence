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
    expect(await chooseSoundRoute(aTrack('ec-3', 8), () => true, 'wave')).toEqual({
      kind: 'carried',
      parameter: 'ec-3',
    });
  });

  it('keeps every channel as lossless FLAC wherever the element takes it', async () => {
    canEncodeAudio.mockResolvedValue(true);

    expect(
      await chooseSoundRoute(aTrack('mlpa', 8), (mimeType) => !mimeType.includes('mlpa'), null),
    ).toEqual({
      kind: 'encoded',
      codec: 'flac',
      parameter: 'flac',
      numberOfChannels: 8,
      isReordered: false,
    });
    expect(canEncodeAudio).toHaveBeenCalledWith('flac', { numberOfChannels: 8 });
  });

  it('keeps 5.1 as AAC, reordered where the encoder reads AAC’s own order', async () => {
    canEncodeAudio.mockResolvedValue(true);

    expect(
      await chooseSoundRoute(aTrack('ac-3', 6), (mimeType) => !/ac-3|flac/.test(mimeType), 'aac'),
    ).toEqual({
      kind: 'encoded',
      codec: 'aac',
      parameter: 'mp4a.40.2',
      numberOfChannels: 6,
      isReordered: true,
    });
  });

  it('folds into stereo where the encoder’s channel order is not known', async () => {
    canEncodeAudio.mockResolvedValue(true);

    expect(
      await chooseSoundRoute(aTrack('ac-3', 6), (mimeType) => !/ac-3|flac/.test(mimeType), null),
    ).toMatchObject({ codec: 'opus', numberOfChannels: 2 });
  });

  it('folds 7.1 into stereo, since no encoder here takes eight channels', async () => {
    canEncodeAudio.mockResolvedValue(true);

    expect(
      await chooseSoundRoute(aTrack('mlpa', 8), (mimeType) => !/mlpa|flac/.test(mimeType), 'wave'),
    ).toEqual({
      kind: 'encoded',
      codec: 'opus',
      parameter: 'opus',
      numberOfChannels: 2,
      isReordered: false,
    });
  });
});
