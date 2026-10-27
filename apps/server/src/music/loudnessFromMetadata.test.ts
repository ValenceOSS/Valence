import { describe, expect, it } from 'vitest';
import type { IAudioMetadata } from 'music-metadata';
import { loudnessFromMetadata } from './loudnessFromMetadata';

const metadata = (
  common: Partial<IAudioMetadata['common']> = {},
  native: IAudioMetadata['native'] = {},
): Pick<IAudioMetadata, 'common' | 'native'> => ({
  common: {
    track: { no: 1, of: 10 },
    disk: { no: null, of: null },
    movementIndex: { no: null, of: null },
    ...common,
  },
  native,
});

describe('loudnessFromMetadata', () => {
  it('reads the ReplayGain tags of a track and its album', () => {
    expect(
      loudnessFromMetadata(
        metadata({
          replaygain_track_gain: { dB: -7.2, ratio: 0.436 },
          replaygain_track_peak: { dB: -0.1, ratio: 0.988 },
          replaygain_album_gain: { dB: -6.4, ratio: 0.479 },
          replaygain_album_peak: { dB: 0, ratio: 1 },
        }),
      ),
    ).toEqual({ trackGainDb: -7.2, trackPeak: 0.988, albumGainDb: -6.4, albumPeak: 1 });
  });

  it('reads a track measured on its own, without an album gain', () => {
    expect(
      loudnessFromMetadata(metadata({ replaygain_track_gain: { dB: -3, ratio: 0.708 } })),
    ).toEqual({ trackGainDb: -3, trackPeak: null, albumGainDb: null, albumPeak: null });
  });

  it('turns an Opus file’s R128 tags into ReplayGain’s terms', () => {
    expect(
      loudnessFromMetadata(
        metadata(
          {},
          {
            vorbis: [
              { id: 'R128_TRACK_GAIN', value: '-2560' },
              { id: 'R128_ALBUM_GAIN', value: '-1280' },
            ],
          },
        ),
      ),
    ).toEqual({ trackGainDb: -5, trackPeak: null, albumGainDb: 0, albumPeak: null });
  });

  it('says nothing for a file that was never measured', () => {
    expect(loudnessFromMetadata(metadata())).toBeNull();
  });

  it('does not believe a gain no recording could need', () => {
    expect(
      loudnessFromMetadata(metadata({ replaygain_track_gain: { dB: 200, ratio: 1 } })),
    ).toBeNull();
  });

  it('does not believe a peak of nothing', () => {
    expect(
      loudnessFromMetadata(
        metadata({
          replaygain_track_gain: { dB: -1, ratio: 0.891 },
          replaygain_track_peak: { dB: Number.NEGATIVE_INFINITY, ratio: 0 },
        }),
      )?.trackPeak,
    ).toBeNull();
  });
});
