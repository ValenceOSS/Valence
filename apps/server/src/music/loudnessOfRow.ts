import type { TrackLoudness } from '@ValenceContracts/schemas/Music';

type LoudnessColumns = {
  trackGainDb: number | null;
  trackPeak: number | null;
  albumGainDb: number | null;
  albumPeak: number | null;
};

/**
 * A track's loudness as the library hands it to players, from the columns it is kept in: nothing
 * until its own gain is known, since an album gain alone says nothing about one song in it.
 *
 * @param row - The track's loudness columns.
 * @returns Its loudness, or nothing where it has not been measured.
 */
const loudnessOfRow = (row: LoudnessColumns): TrackLoudness | null =>
  row.trackGainDb === null
    ? null
    : {
        trackGainDb: row.trackGainDb,
        trackPeak: row.trackPeak,
        albumGainDb: row.albumGainDb,
        albumPeak: row.albumGainDb === null ? null : row.albumPeak,
      };

export type { LoudnessColumns };

export { loudnessOfRow };
