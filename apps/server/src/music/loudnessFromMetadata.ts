import type { IAudioMetadata } from 'music-metadata';
import type { TrackLoudness } from '@ValenceContracts/schemas/Music';

const MOST_GAIN_DB = 60;

const R128_STEPS_PER_DB = 256;

const R128_TO_REPLAYGAIN_DB = 5;

/**
 * A gain that can be believed: a finite number of decibels no further from nothing than any real
 * recording is, rather than a tag written by something that got it wrong.
 *
 * @param gainDb - What the tag said.
 * @returns The gain, or nothing where it cannot be believed.
 */
const believable = (gainDb: number | undefined | null): number | null =>
  gainDb === undefined ||
  gainDb === null ||
  !Number.isFinite(gainDb) ||
  Math.abs(gainDb) > MOST_GAIN_DB
    ? null
    : gainDb;

/**
 * A peak that can be believed: a positive, finite share of full scale.
 *
 * @param peak - What the tag said.
 * @returns The peak, or nothing where it cannot be believed.
 */
const believablePeak = (peak: number | undefined): number | null =>
  peak === undefined || !Number.isFinite(peak) || peak <= 0 ? null : peak;

/**
 * An Opus file's own loudness tag, which counts in 256ths of a decibel from EBU R128's −23 LUFS,
 * turned into ReplayGain's decibels from −18 LUFS.
 *
 * @param meta - The file's metadata.
 * @param id - Which tag: the track's or the album's.
 * @returns The gain in ReplayGain's terms, or nothing where the file has no such tag.
 */
const r128GainDb = (meta: Pick<IAudioMetadata, 'native'>, id: string): number | null => {
  const tagged = (meta.native['vorbis'] ?? []).find((tag) => tag.id.toUpperCase() === id);
  const value = tagged?.value;
  const steps =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseInt(value, 10)
        : NaN;

  return Number.isFinite(steps) ? steps / R128_STEPS_PER_DB + R128_TO_REPLAYGAIN_DB : null;
};

/**
 * How loud a track says it is, from its ReplayGain tags or an Opus file's R128 tags: the gain that
 * brings it to ReplayGain's reference loudness, its loudest moment, and the same for its album where
 * the album was measured as a whole.
 *
 * @param meta - The file's metadata.
 * @returns Its loudness, or nothing where the file was never measured.
 */
const loudnessFromMetadata = (
  meta: Pick<IAudioMetadata, 'common' | 'native'>,
): TrackLoudness | null => {
  const { common } = meta;
  const trackGainDb = believable(
    common.replaygain_track_gain?.dB ?? r128GainDb(meta, 'R128_TRACK_GAIN'),
  );

  if (trackGainDb === null) {
    return null;
  }

  const albumGainDb = believable(
    common.replaygain_album_gain?.dB ?? r128GainDb(meta, 'R128_ALBUM_GAIN'),
  );

  return {
    trackGainDb,
    trackPeak: believablePeak(common.replaygain_track_peak?.ratio),
    albumGainDb,
    albumPeak: albumGainDb === null ? null : believablePeak(common.replaygain_album_peak?.ratio),
  };
};

export { loudnessFromMetadata };
