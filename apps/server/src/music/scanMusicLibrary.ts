import { isUnderAny } from '@ValenceServer/library/isUnderAny';
import { basename, dirname } from 'node:path';
import { isAudioFile } from './isAudioFile';
import { hasRealWords } from './hasRealWords';
import { nameKey } from './nameKey';
import type { ScanResult } from '@ValenceContracts/schemas/Library';
import type { TrackPicture, TrackTags } from './TrackTags';

type ScanFindings = {
  files: ScannedFile[];
  unreadable: string[];
};

type ScannedFile = {
  path: string;
  sizeBytes: number;
  modifiedAtMs: number;
};

type StoredTrack = ScannedFile & {
  lyricsModifiedAtMs: number | null;
};

type ArtworkSource = { picture: TrackPicture } | { path: string } | { bytes: Uint8Array };

type MusicFileSystem = {
  listFiles: (root: string) => Promise<ScanFindings>;
  readTags: (path: string) => Promise<TrackTags | null>;
  readSidecarLyrics: (path: string) => Promise<string | null>;
  findFolderArt: (folder: string) => Promise<string | null>;
  findArtistImage: (albumFolder: string) => Promise<string | null>;
};

type KeptArtist = { id: string; hasImage: boolean };

type KeptAlbum = { id: string; hasArtwork: boolean };

type AlbumRow = {
  libraryId: string;
  artistId: string;
  title: string;
  year: number | null;
  genres: string[];
  isCompilation: boolean;
  musicbrainzId: string | null;
  releaseGroupMusicbrainzId: string | null;
};

type TrackRow = {
  libraryId: string;
  albumId: string;
  artistIds: string[];
  path: string;
  sizeBytes: number;
  modifiedAtMs: number;
  title: string;
  year: number | null;
  genres: string[];
  durationSeconds: number;
  container: string;
  codec: string;
  isLossless: boolean;
  isExplicit: boolean;
  bitDepth: number | null;
  sampleRate: number | null;
  bitrateKbps: number | null;
  discNumber: number | null;
  trackNumber: number | null;
  lyrics: string | null;
  lyricsModifiedAtMs: number | null;
};

type MusicStore = {
  listStored: (libraryId: string) => Promise<StoredTrack[]>;
  keepArtist: (
    libraryId: string,
    name: string,
    musicbrainzId: string | null,
  ) => Promise<KeptArtist>;
  keepAlbum: (row: AlbumRow) => Promise<KeptAlbum>;
  keepTrack: (row: TrackRow) => Promise<void>;
  forgetMissingArtwork?: (libraryId: string) => Promise<string[]>;
  setAlbumArtwork: (albumId: string, path: string) => Promise<void>;
  setArtistImage: (artistId: string, path: string) => Promise<void>;
  removeByPaths: (libraryId: string, paths: string[]) => Promise<number>;
  prune: (libraryId: string) => Promise<void>;
  markScanned: (libraryId: string) => Promise<void>;
};

type MusicArtwork = {
  keep: (kind: 'album' | 'artist', id: string, source: ArtworkSource) => Promise<string | null>;
};

type ScanMusicLibraryOptions = {
  libraryId: string;
  root: string;
  files: MusicFileSystem;
  store: MusicStore;
  artwork: MusicArtwork;
  force?: boolean;
  isPartial?: boolean;
  onProblem?: (path: string, reason: string) => void;
  onProgress?: (processed: number, total: number) => void;
  isCancelled?: () => boolean;
};

const VARIOUS_ARTISTS = 'Various Artists';

const LYRIC_FILE = /\.(lrc|txt)$/i;

const UNKNOWN_ARTIST = 'Unknown Artist';

/**
 * A file's path without its extension, which is what a track and the lyrics beside it share.
 *
 * @param path - The file.
 * @returns The path it is named from.
 */
const stemOf = (path: string): string => path.replace(/\.[^./]+$/, '');

/**
 * Reads a library of music into artists, albums and tracks.
 *
 * Shaped like the scans that read films and books, and skipping in the same way: a file whose size
 * and time are what they were last time is left alone. The exception is a record whose cover or artist picture
 * has gone from the cache it was kept in: its tracks are read again, so a scan puts back what a
 * cleared cache took, rather than leaving a blank tile nothing would ever fill. What a track is comes from its tags rather
 * than its path — artist, album, disc and track number are all there, and more reliably than any
 * folder convention — with the folder standing in for an album's name only where no tag names one.
 *
 * An album belongs to its album artist, or to "Various Artists" where it is marked a compilation,
 * so a record with a guest on every track is still one record. Each track then links to every
 * artist it credits, which is what puts a guest verse on the guest's page too.
 *
 * An album's artwork is read once a scan: the front cover inside the first track that has one, then
 * a cover image in the album's folder. An artist's picture comes from an image beside their albums,
 * which is where every library manager puts one. Lyrics come from the tags, or from an `.lrc` or
 * `.txt` beside the track — and a lyrics file dropped in, changed or taken away later is noticed on
 * the next scan by its own time, since that is how lyrics usually arrive: after the music.
 *
 * A partial scan reads one folder of the library, such as an album just filed into it, and takes
 * away only what is gone from that folder — the rest of the library is not under it, not gone.
 *
 * @param options - The library, where it is, what to read it with, and where to put it.
 * @returns What the scan changed.
 */
const scanMusicLibrary = async (options: ScanMusicLibraryOptions): Promise<ScanResult> => {
  const {
    libraryId,
    root,
    files,
    store,
    artwork,
    force = false,
    isPartial = false,
    onProblem,
    onProgress,
    isCancelled,
  } = options;

  const walked = await files.listFiles(root);
  const everything = walked.files;
  const found = everything.filter((file) => isAudioFile(file.path));
  const stored = new Map((await store.listStored(libraryId)).map((row) => [row.path, row]));
  const lyricFiles = new Map(
    everything
      .filter((file) => LYRIC_FILE.test(file.path))
      .map((file) => [stemOf(file.path), file.modifiedAtMs]),
  );

  const unpictured = new Set(
    force || isPartial ? [] : ((await store.forgetMissingArtwork?.(libraryId)) ?? []),
  );

  const changed = found.filter((file) => {
    const already = stored.get(file.path);

    return (
      force ||
      unpictured.has(file.path) ||
      already === undefined ||
      already.sizeBytes !== file.sizeBytes ||
      already.modifiedAtMs !== file.modifiedAtMs ||
      already.lyricsModifiedAtMs !== (lyricFiles.get(stemOf(file.path)) ?? null)
    );
  });

  const artists = new Map<string, KeptArtist>();
  const pictured = new Set<string>();
  const dressed = new Set<string>();
  let added = 0;
  let updated = 0;
  let failed = 0;
  let processed = 0;

  const artistNamed = async (name: string, musicbrainzId: string | null): Promise<KeptArtist> => {
    const key = nameKey(name);
    const known = artists.get(key);

    if (known !== undefined) {
      return known;
    }

    const kept = await store.keepArtist(libraryId, name, musicbrainzId);

    artists.set(key, kept);

    return kept;
  };

  for (const file of changed) {
    if (isCancelled?.() === true) {
      break;
    }

    processed += 1;
    onProgress?.(processed, changed.length);

    const tags = await files.readTags(file.path).catch(() => null);

    if (tags === null) {
      failed += 1;
      onProblem?.(file.path, 'That file could not be read as a track.');

      continue;
    }

    const folder = dirname(file.path);
    const albumArtistName = tags.isCompilation
      ? VARIOUS_ARTISTS
      : (tags.albumArtists[0] ?? tags.artists[0] ?? UNKNOWN_ARTIST);
    const albumArtist = await artistNamed(
      albumArtistName,
      tags.isCompilation ? null : (tags.artistMusicbrainzIds[0] ?? null),
    );

    const album = await store.keepAlbum({
      libraryId,
      artistId: albumArtist.id,
      title: tags.album ?? basename(folder),
      year: tags.year,
      genres: tags.genres,
      isCompilation: tags.isCompilation,
      musicbrainzId: tags.albumMusicbrainzId,
      releaseGroupMusicbrainzId: tags.releaseGroupMusicbrainzId,
    });

    const credited = tags.artists.length === 0 ? [albumArtistName] : tags.artists;
    const artistIds: string[] = [];

    for (const name of credited) {
      artistIds.push((await artistNamed(name, null)).id);
    }

    const worthKeeping = (words: string | null): string | null =>
      words !== null && hasRealWords(words) ? words : null;
    const lyrics =
      worthKeeping(tags.lyrics) ??
      worthKeeping(await files.readSidecarLyrics(file.path).catch(() => null));

    await store.keepTrack({
      libraryId,
      albumId: album.id,
      artistIds,
      path: file.path,
      sizeBytes: file.sizeBytes,
      modifiedAtMs: file.modifiedAtMs,
      title: tags.title,
      year: tags.year,
      genres: tags.genres,
      durationSeconds: tags.durationSeconds,
      container: tags.container,
      codec: tags.codec,
      isLossless: tags.isLossless,
      isExplicit: tags.isExplicit,
      bitDepth: tags.bitDepth,
      sampleRate: tags.sampleRate,
      bitrateKbps: tags.bitrateKbps,
      discNumber: tags.discNumber,
      trackNumber: tags.trackNumber,
      lyrics,
      lyricsModifiedAtMs: lyricFiles.get(stemOf(file.path)) ?? null,
    });

    if (!pictured.has(album.id) && (force || !album.hasArtwork)) {
      const folderArt =
        tags.picture === null ? await files.findFolderArt(folder).catch(() => null) : null;
      const source: ArtworkSource | null =
        tags.picture === null
          ? folderArt === null
            ? null
            : { path: folderArt }
          : { picture: tags.picture };
      const kept = source === null ? null : await artwork.keep('album', album.id, source);

      if (kept !== null) {
        pictured.add(album.id);
        await store.setAlbumArtwork(album.id, kept);
      }
    }

    if (!dressed.has(albumArtist.id) && (force || !albumArtist.hasImage)) {
      dressed.add(albumArtist.id);

      const image = await files.findArtistImage(folder).catch(() => null);
      const kept =
        image === null ? null : await artwork.keep('artist', albumArtist.id, { path: image });

      if (kept !== null) {
        await store.setArtistImage(albumArtist.id, kept);
      }
    }

    if (stored.has(file.path)) {
      updated += 1;
    } else {
      added += 1;
    }
  }

  const present = new Set(found.map((file) => file.path));
  const within = `${root.replace(/\/+$/, '')}/`;
  const gone = [...stored.keys()].filter(
    (path) =>
      !present.has(path) &&
      !isUnderAny(path, walked.unreadable) &&
      (!isPartial || path.startsWith(within)),
  );
  const removed = gone.length === 0 ? 0 : await store.removeByPaths(libraryId, gone);

  await store.prune(libraryId);

  if (!isPartial) {
    await store.markScanned(libraryId);
  }

  return { added, updated, removed, failed };
};

export type {
  AlbumRow,
  ArtworkSource,
  KeptAlbum,
  KeptArtist,
  MusicArtwork,
  MusicFileSystem,
  MusicStore,
  ScannedFile,
  ScanMusicLibraryOptions,
  StoredTrack,
  TrackRow,
};

export { scanMusicLibrary };
