import { bookAudioUrl } from '@ValenceClient/books/fetchListening';
import { trackStreamUrl } from '@ValenceClient/music/fetchMusic';
import { playableQuality } from '@ValenceClient/music/playableQuality';
import type { KeptListening } from '@ValenceContracts/schemas/KeptListening';
import type { AudioQuality, MusicTrack } from '@ValenceContracts/schemas/Music';

type FileToKeep = { name: string; from: string };

const LOSSLESS_ENDINGS: Readonly<Record<string, string>> = {
  flac: 'flac',
  mp3: 'mp3',
  'mpeg 1 layer 3': 'mp3',
  'mpeg 2 layer 3': 'mp3',
  aac: 'm4a',
  'mpeg-4/aac': 'm4a',
  alac: 'm4a',
  opus: 'ogg',
  vorbis: 'ogg',
};

/**
 * The ending a kept track's file is given, so a player that reads a file by its name knows it.
 *
 * @param track - The track.
 * @param quality - The quality it is kept at.
 * @returns The ending, without its dot.
 */
const endingOf = (track: Pick<MusicTrack, 'codec'>, quality: AudioQuality): string => {
  if (quality !== 'lossless') {
    return 'm4a';
  }

  const codec = track.codec.toLowerCase();

  return LOSSLESS_ENDINGS[codec] ?? (codec.startsWith('pcm') ? 'wav' : 'm4a');
};

/**
 * The name a kept track's file is given on a device.
 *
 * @param trackId - The track.
 * @returns The start every quality of it shares.
 */
const keptTrackPrefix = (trackId: string): string => `track-${trackId}-`;

/**
 * The name a kept audiobook track's file is given on a device.
 *
 * @param chapterId - The audiobook's track.
 * @returns The start of its name.
 */
const keptChapterPrefix = (chapterId: string): string => `chapter-${chapterId}.`;

/**
 * The name of the artwork kept beside something kept.
 *
 * @param kept - What is kept.
 * @returns The artwork's name.
 */
const keptArtworkName = (kept: Pick<KeptListening, 'kind' | 'id'>): string =>
  `artwork-${kept.kind}-${kept.id}.jpg`;

/**
 * Every file a device fetches to keep an album, a playlist, liked songs or an audiobook: each
 * track at the quality chosen, or the nearest this device can play, and the artwork.
 *
 * @param kept - What is kept.
 * @param canPlay - Whether this device plays a kind of file.
 * @returns The files, in the order they are fetched.
 */
const filesOfKeptListening = (
  kept: KeptListening,
  canPlay: (type: string) => boolean,
): FileToKeep[] => {
  const artwork =
    kept.artworkFrom === null ? [] : [{ name: keptArtworkName(kept), from: kept.artworkFrom }];

  if (kept.kind === 'audiobook') {
    return [
      ...artwork,
      ...kept.chapters.map((chapter) => ({
        name: `${keptChapterPrefix(chapter.id)}${chapter.format}`,
        from: bookAudioUrl(chapter.bookId, chapter.id),
      })),
    ];
  }

  const chosen = kept.quality ?? 'high';

  return [
    ...artwork,
    ...kept.tracks.map((track) => {
      const quality = playableQuality(track, chosen, canPlay);

      return {
        name: `${keptTrackPrefix(track.id)}${quality}.${endingOf(track, quality)}`,
        from: trackStreamUrl(track.id, quality),
      };
    }),
  ];
};

export type { FileToKeep };

export { filesOfKeptListening, keptArtworkName, keptChapterPrefix, keptTrackPrefix };
