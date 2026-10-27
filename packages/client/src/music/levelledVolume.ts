import type { MusicLevelling } from '@ValenceClient/music/musicPreferences';
import type { MusicTrack } from '@ValenceContracts/schemas/Music';

/**
 * How loud to play a song so songs sit at one loudness: the volume chosen, turned down by the
 * song's own gain or its album's, and never so far up that its loudest moment would clip. A song
 * the scan has not measured yet, or somebody who turned levelling off, plays at the volume chosen.
 *
 * @param volume - The volume chosen, from silent at 0 to full at 1.
 * @param track - The song.
 * @param levelling - Whether to level each song on its own, each album as a whole, or not at all.
 * @returns The volume to play it at, from 0 to 1.
 */
const levelledVolume = (
  volume: number,
  track: Pick<MusicTrack, 'loudness'> | null,
  levelling: MusicLevelling,
): number => {
  const loudness = track?.loudness ?? null;

  if (levelling === 'off' || loudness === null) {
    return volume;
  }

  const isAlbum = levelling === 'album' && loudness.albumGainDb !== null;
  const gainDb = isAlbum ? (loudness.albumGainDb ?? loudness.trackGainDb) : loudness.trackGainDb;
  const peak = isAlbum ? (loudness.albumPeak ?? loudness.trackPeak) : loudness.trackPeak;
  const gain = 10 ** (gainDb / 20);
  const headroom = peak === null ? 1 : 1 / peak;

  return Math.min(1, Math.max(0, volume * Math.min(gain, headroom, 1)));
};

export { levelledVolume };
