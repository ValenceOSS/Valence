import { REPLAYGAIN_REFERENCE_LUFS } from '@ValenceServer/music/REPLAYGAIN_REFERENCE_LUFS';

type MeasuredTrack = {
  durationSeconds: number;
  trackGainDb: number;
  trackPeak: number | null;
};

/**
 * An album's gain and peak worked out from its songs, as though it had been measured as one
 * recording: each song's loudness turned back into energy, weighted by how long it plays, and the
 * whole turned back into a gain, so a quiet interlude moves the album's loudness only as much as
 * its few seconds deserve. The album's peak is the loudest of its songs'.
 *
 * @param tracks - The album's songs, every one of them measured.
 * @returns The album's gain and peak, or nothing where there is nothing to weigh.
 */
const albumGainOf = (
  tracks: readonly MeasuredTrack[],
): { gainDb: number; peak: number | null } | null => {
  const playing = tracks.filter((track) => track.durationSeconds > 0);
  const seconds = playing.reduce((sum, track) => sum + track.durationSeconds, 0);

  if (seconds === 0) {
    return null;
  }

  const energy =
    playing.reduce(
      (sum, track) =>
        sum + track.durationSeconds * 10 ** ((REPLAYGAIN_REFERENCE_LUFS - track.trackGainDb) / 10),
      0,
    ) / seconds;
  const peaks = tracks.flatMap((track) => (track.trackPeak === null ? [] : [track.trackPeak]));

  return {
    gainDb: REPLAYGAIN_REFERENCE_LUFS - 10 * Math.log10(energy),
    peak: peaks.length === 0 ? null : Math.max(...peaks),
  };
};

export type { MeasuredTrack };

export { albumGainOf };
