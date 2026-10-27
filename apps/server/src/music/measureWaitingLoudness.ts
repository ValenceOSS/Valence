import { mapWithLimit } from '@ValenceCore/functions/mapWithLimit';
import { albumGainOf } from '@ValenceServer/music/albumGainOf';
import type { MeasuredTrack } from '@ValenceServer/music/albumGainOf';
import { REPLAYGAIN_REFERENCE_LUFS } from '@ValenceServer/music/REPLAYGAIN_REFERENCE_LUFS';
import type { MeasuredLoudness } from '@ValenceServer/transcoder/TranscoderClient';

type WaitingTrack = { id: string; path: string };

type AlbumToLevel = { albumId: string; tracks: MeasuredTrack[] };

type LoudnessStore = {
  waiting: () => Promise<WaitingTrack[]>;
  keepMeasured: (
    trackId: string,
    measured: { trackGainDb: number; trackPeak: number } | null,
    now: Date,
  ) => Promise<void>;
  albumsToLevel: () => Promise<AlbumToLevel[]>;
  keepAlbum: (albumId: string, gainDb: number, peak: number | null) => Promise<void>;
};

type LoudnessMeasuring = {
  store: LoudnessStore;
  measure: (path: string) => Promise<MeasuredLoudness | null>;
  onProgress: (done: number, total: number) => void;
  isCancelled: () => boolean;
  now: () => Date;
};

type LoudnessMeasured = { measured: number; unheard: number; albums: number };

const AT_ONCE = 2;

const MOST_GAIN_DB = 60;

/**
 * The gain that brings a song measured at this loudness to ReplayGain's reference, held to what
 * any real recording could need.
 *
 * @param integratedLufs - The song's integrated loudness.
 * @returns The gain in decibels.
 */
const gainFor = (integratedLufs: number): number =>
  Math.min(MOST_GAIN_DB, Math.max(-MOST_GAIN_DB, REPLAYGAIN_REFERENCE_LUFS - integratedLufs));

/**
 * Measures every song that has neither a loudness tag nor a measurement yet, a couple at a time,
 * then works out an album's gain for every album whose songs are all measured and that has none.
 * Each song is tried once: one that could not be measured is not tried again until its file
 * changes, and stopping part way leaves the rest waiting for next time.
 *
 * @param measuring - Where songs are kept, how one is measured, and where progress goes.
 * @returns How many songs were measured, how many had nothing to hear, and how many albums levelled.
 */
const measureWaitingLoudness = async ({
  store,
  measure,
  onProgress,
  isCancelled,
  now,
}: LoudnessMeasuring): Promise<LoudnessMeasured> => {
  const waiting = await store.waiting();
  let done = 0;
  let measured = 0;
  let unheard = 0;

  onProgress(done, waiting.length);

  await mapWithLimit(waiting, AT_ONCE, async (track) => {
    if (isCancelled()) {
      return;
    }

    const heard = await measure(track.path).catch(() => null);

    await store.keepMeasured(
      track.id,
      heard === null
        ? null
        : { trackGainDb: gainFor(heard.integratedLufs), trackPeak: heard.truePeak },
      now(),
    );

    if (heard === null) {
      unheard += 1;
    } else {
      measured += 1;
    }

    done += 1;
    onProgress(done, waiting.length);
  });

  let albums = 0;

  if (!isCancelled()) {
    for (const album of await store.albumsToLevel()) {
      const levelled = albumGainOf(album.tracks);

      if (levelled !== null) {
        await store.keepAlbum(album.albumId, levelled.gainDb, levelled.peak);
        albums += 1;
      }
    }
  }

  return { measured, unheard, albums };
};

export type { AlbumToLevel, LoudnessMeasuring, LoudnessStore, WaitingTrack };

export { measureWaitingLoudness };
