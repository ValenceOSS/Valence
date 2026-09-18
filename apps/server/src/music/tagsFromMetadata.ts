import { basename, extname } from 'node:path';
import type { IAudioMetadata, ILyricsTag, IPicture } from 'music-metadata';
import { splitArtists } from './splitArtists';
import type { TrackPicture, TrackTags } from './TrackTags';

/**
 * Names a track from its file where its tags do not, the way a folder of rips is usually named:
 * "01. Look To Windward.flac" is the track called "Look To Windward".
 *
 * @param fileName - The file's name.
 * @returns The title the name suggests.
 */
const titleFromFileName = (fileName: string): string => {
  const bare = basename(fileName, extname(fileName));
  const titled = bare.replace(/^\s*(?:\d{1,2}[-.])?\d{1,3}(?:\s*[-._)]\s*|\s+)/, '').trim();

  return titled === '' ? bare : titled;
};

/**
 * Writes a stamp the way LRC does, so lyrics a tag carries in sync read the same as a sidecar.
 *
 * @param ms - The time.
 * @returns The stamp.
 */
const lrcStamp = (ms: number): string => {
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  const hundredths = Math.floor((ms % 1000) / 10);

  return `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}]`;
};

/**
 * Reads whichever lyrics a tag holds, preferring lines that follow the song.
 *
 * @param tagged - The lyrics the tags carry.
 * @returns The lyrics as LRC or plain text, or nothing.
 */
const lyricsFrom = (tagged: readonly ILyricsTag[] | undefined): string | null => {
  const synced = tagged?.find((entry) =>
    entry.syncText.some((line) => line.timestamp !== undefined),
  );

  if (synced !== undefined) {
    return synced.syncText
      .filter((line) => line.timestamp !== undefined)
      .map((line) => `${lrcStamp(line.timestamp ?? 0)}${line.text}`)
      .join('\n');
  }

  const plain = tagged?.find((entry) => (entry.text ?? '').trim() !== '')?.text;

  return plain === undefined ? null : plain;
};

/**
 * Chooses the picture to stand for an album out of those a track carries: the front cover where
 * one is marked as such, otherwise whatever came first.
 *
 * @param pictures - The pictures in the tags.
 * @returns The cover, or nothing.
 */
const coverFrom = (pictures: readonly IPicture[] | undefined): TrackPicture | null => {
  const chosen =
    pictures?.find((picture) => picture.type?.toLowerCase().includes('front') === true) ??
    pictures?.[0];

  return chosen === undefined ? null : { bytes: chosen.data, contentType: chosen.format };
};

/**
 * Splits a genre tag the way they are usually written, several to one value.
 *
 * @param tagged - The genre values.
 * @returns Each genre once.
 */
const genresFrom = (tagged: readonly string[] | undefined): string[] => {
  const named = (tagged ?? [])
    .flatMap((value) => value.split(/\s*[,;/]\s*/))
    .map((value) => value.trim())
    .filter((value) => value !== '');

  return [...new Set(named)];
};

/**
 * Reads what a track's tags say about it into what the library keeps.
 *
 * Tags are what a music library is built from — far more reliable than any path convention — so
 * everything that can come from them does, and the file name is only a fallback for the title.
 * Whoever an album is by is its album artist where one is tagged, then the track's own first
 * artist, so a compilation with a guest on every track still lands as one album.
 *
 * @param meta - What the tag reader found.
 * @param path - Where the file is, for the fallback title and the container.
 * @returns The track's tags.
 */
const tagsFromMetadata = (meta: IAudioMetadata, path: string): TrackTags => {
  const { common, format } = meta;
  const artists = splitArtists(
    common.artists ?? (common.artist === undefined ? [] : [common.artist]),
  );
  const albumArtists = splitArtists(
    common.albumartists ?? (common.albumartist === undefined ? [] : [common.albumartist]),
  );
  const title = common.title?.trim() ?? '';

  return {
    title: title === '' ? titleFromFileName(path) : title,
    artists,
    albumArtists,
    album: common.album?.trim() === '' ? null : (common.album?.trim() ?? null),
    year: common.year ?? null,
    genres: genresFrom(common.genre),
    discNumber: common.disk.no,
    trackNumber: common.track.no,
    isCompilation: common.compilation === true,
    durationSeconds: format.duration ?? 0,
    codec: (format.codec ?? format.container ?? extname(path).slice(1)).toLowerCase(),
    container: (format.container ?? extname(path).slice(1)).toLowerCase(),
    isLossless: format.lossless === true,
    bitDepth: format.bitsPerSample ?? null,
    sampleRate: format.sampleRate ?? null,
    bitrateKbps: format.bitrate === undefined ? null : Math.round(format.bitrate / 1000),
    lyrics: lyricsFrom(common.lyrics),
    picture: coverFrom(common.picture),
    albumMusicbrainzId: common.musicbrainz_albumid ?? null,
    artistMusicbrainzIds: common.musicbrainz_albumartistid ?? common.musicbrainz_artistid ?? [],
  };
};

export { tagsFromMetadata, titleFromFileName };
