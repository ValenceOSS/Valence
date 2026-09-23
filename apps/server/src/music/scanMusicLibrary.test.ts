import { describe, expect, it, vi } from 'vitest';
import { scanMusicLibrary } from './scanMusicLibrary';
import type {
  AlbumRow,
  MusicArtwork,
  MusicFileSystem,
  MusicStore,
  ScannedFile,
  StoredTrack,
  TrackRow,
} from './scanMusicLibrary';
import type { TrackTags } from './TrackTags';

const ALBUM = '/music/Sleep Token - Even In Arcadia';

const tagsFor = (overrides: Partial<TrackTags> = {}): TrackTags => ({
  title: 'Look To Windward',
  artists: ['Sleep Token'],
  albumArtists: ['Sleep Token'],
  album: 'Even In Arcadia',
  year: 2025,
  genres: ['Rock'],
  discNumber: null,
  trackNumber: 1,
  isCompilation: false,
  durationSeconds: 466,
  codec: 'flac',
  container: 'flac',
  isLossless: true,
  isExplicit: false,
  bitDepth: 24,
  sampleRate: 44_100,
  bitrateKbps: 1492,
  lyrics: null,
  picture: null,
  albumMusicbrainzId: null,
  releaseGroupMusicbrainzId: null,
  artistMusicbrainzIds: [],
  ...overrides,
});

const fileAt = (path: string, sizeBytes = 100, modifiedAtMs = 1): ScannedFile => ({
  path,
  sizeBytes,
  modifiedAtMs,
});

/**
 * A store that keeps what it is given in memory, so a scan can be read back.
 */
const storedAt = (path: string, lyricsModifiedAtMs: number | null = null): StoredTrack => ({
  ...fileAt(path),
  lyricsModifiedAtMs,
});

const memoryStore = (stored: StoredTrack[] = []) => {
  const artists = new Map<string, { id: string; name: string; hasImage: boolean }>();
  const albums = new Map<string, AlbumRow & { id: string; hasArtwork: boolean }>();
  const tracks: TrackRow[] = [];

  const store = {
    listStored: vi.fn(() => Promise.resolve(stored)),
    keepArtist: vi.fn((_libraryId: string, name: string) => {
      const known = artists.get(name.toLowerCase());

      if (known !== undefined) {
        return Promise.resolve({ id: known.id, hasImage: known.hasImage });
      }

      const id = `artist-${(artists.size + 1).toString()}`;

      artists.set(name.toLowerCase(), { id, name, hasImage: false });

      return Promise.resolve({ id, hasImage: false });
    }),
    keepAlbum: vi.fn((row: AlbumRow) => {
      const key = `${row.artistId}/${row.title}`;
      const known = albums.get(key);

      if (known !== undefined) {
        return Promise.resolve({ id: known.id, hasArtwork: known.hasArtwork });
      }

      const id = `album-${(albums.size + 1).toString()}`;

      albums.set(key, { ...row, id, hasArtwork: false });

      return Promise.resolve({ id, hasArtwork: false });
    }),
    keepTrack: vi.fn((row: TrackRow) => {
      tracks.push(row);

      return Promise.resolve();
    }),
    setAlbumArtwork: vi.fn(() => Promise.resolve()),
    setArtistImage: vi.fn(() => Promise.resolve()),
    removeByPaths: vi.fn((_libraryId: string, paths: string[]) => Promise.resolve(paths.length)),
    prune: vi.fn(() => Promise.resolve()),
    markScanned: vi.fn(() => Promise.resolve()),
  } satisfies MusicStore;

  return { store, artists, albums, tracks };
};

const filesWith = (
  found: ScannedFile[],
  tags: Record<string, TrackTags | null>,
  extras: Partial<MusicFileSystem> = {},
  unreadable: string[] = [],
): MusicFileSystem => ({
  listFiles: () => Promise.resolve({ files: found, unreadable }),
  readTags: (path) => Promise.resolve(tags[path] ?? null),
  readSidecarLyrics: () => Promise.resolve(null),
  findFolderArt: () => Promise.resolve(null),
  findArtistImage: () => Promise.resolve(null),
  ...extras,
});

const keptArtwork = (): MusicArtwork & { keep: ReturnType<typeof vi.fn> } => ({
  keep: vi.fn((kind: 'album' | 'artist', id: string) =>
    Promise.resolve(`/cache/${kind}-${id}.webp`),
  ),
});

describe('scanMusicLibrary', () => {
  it('files every track under its album and its artist', async () => {
    const { store, albums, artists, tracks } = memoryStore();
    const one = `${ALBUM}/01. Look To Windward.flac`;
    const two = `${ALBUM}/02. Emergence.flac`;

    const result = await scanMusicLibrary({
      libraryId: 'lib',
      root: '/music',
      store,
      artwork: keptArtwork(),
      files: filesWith([fileAt(one), fileAt(two)], {
        [one]: tagsFor(),
        [two]: tagsFor({ title: 'Emergence', trackNumber: 2 }),
      }),
    });

    expect(result).toEqual({ added: 2, updated: 0, removed: 0, failed: 0 });
    expect(albums.size).toBe(1);
    expect(artists.size).toBe(1);
    expect(tracks.map((track) => [track.title, track.trackNumber])).toEqual([
      ['Look To Windward', 1],
      ['Emergence', 2],
    ]);
  });

  it('reads only audio, leaving the pictures and notes beside it alone', async () => {
    const { store, tracks } = memoryStore();
    const track = `${ALBUM}/01.flac`;

    await scanMusicLibrary({
      libraryId: 'lib',
      root: '/music',
      store,
      artwork: keptArtwork(),
      files: filesWith([fileAt(track), fileAt(`${ALBUM}/cover.jpg`), fileAt(`${ALBUM}/INFO.nfo`)], {
        [track]: tagsFor(),
      }),
    });

    expect(tracks).toHaveLength(1);
  });

  it('links a guest to the track they are on, while the album stays with its artist', async () => {
    const { store, artists, tracks } = memoryStore();
    const track = `${ALBUM}/05.flac`;

    await scanMusicLibrary({
      libraryId: 'lib',
      root: '/music',
      store,
      artwork: keptArtwork(),
      files: filesWith([fileAt(track)], {
        [track]: tagsFor({ artists: ['Sleep Token', 'Guest'] }),
      }),
    });

    expect([...artists.values()].map((artist) => artist.name)).toEqual(['Sleep Token', 'Guest']);
    expect(tracks[0]?.artistIds).toEqual(['artist-1', 'artist-2']);
  });

  it('files a compilation under various artists', async () => {
    const { store, albums, artists } = memoryStore();
    const track = '/music/Now 99/01.mp3';

    await scanMusicLibrary({
      libraryId: 'lib',
      root: '/music',
      store,
      artwork: keptArtwork(),
      files: filesWith([fileAt(track)], {
        [track]: tagsFor({ isCompilation: true, albumArtists: [], artists: ['Someone'] }),
      }),
    });

    const album = [...albums.values()][0];

    expect(artists.get('various artists')?.id).toBe(album?.artistId);
  });

  it('names an album after its folder where no tag names it', async () => {
    const { store, albums } = memoryStore();
    const track = '/music/Untagged Record/01.mp3';

    await scanMusicLibrary({
      libraryId: 'lib',
      root: '/music',
      store,
      artwork: keptArtwork(),
      files: filesWith([fileAt(track)], { [track]: tagsFor({ album: null }) }),
    });

    expect([...albums.values()][0]?.title).toBe('Untagged Record');
  });

  it('leaves a file whose size and time have not changed alone', async () => {
    const track = `${ALBUM}/01.flac`;
    const { store, tracks } = memoryStore([storedAt(track)]);
    const readTags = vi.fn(() => Promise.resolve(tagsFor()));

    const result = await scanMusicLibrary({
      libraryId: 'lib',
      root: '/music',
      store,
      artwork: keptArtwork(),
      files: filesWith([fileAt(track)], {}, { readTags }),
    });

    expect(readTags).not.toHaveBeenCalled();
    expect(tracks).toHaveLength(0);
    expect(result.updated).toBe(0);
  });

  it('reads everything again when forced to', async () => {
    const track = `${ALBUM}/01.flac`;
    const { store } = memoryStore([storedAt(track)]);

    const result = await scanMusicLibrary({
      libraryId: 'lib',
      root: '/music',
      store,
      artwork: keptArtwork(),
      force: true,
      files: filesWith([fileAt(track)], { [track]: tagsFor() }),
    });

    expect(result.updated).toBe(1);
  });

  it('reads an unchanged record again where its cover has gone from the cache', async () => {
    const track = `${ALBUM}/01.flac`;
    const { store } = memoryStore([storedAt(track)]);
    const artwork = keptArtwork();
    const readTags = vi.fn(() => Promise.resolve(tagsFor()));

    const result = await scanMusicLibrary({
      libraryId: 'lib',
      root: '/music',
      store: { ...store, forgetMissingArtwork: vi.fn(() => Promise.resolve([track])) },
      artwork,
      files: filesWith(
        [fileAt(track)],
        {},
        { readTags, findFolderArt: () => Promise.resolve(`${ALBUM}/cover.jpg`) },
      ),
    });

    expect(readTags).toHaveBeenCalledWith(track);
    expect(result.updated).toBe(1);
    expect(store.setAlbumArtwork).toHaveBeenCalled();
  });

  it('does not ask after lost covers on a scan of part of the library', async () => {
    const track = `${ALBUM}/01.flac`;
    const { store } = memoryStore([storedAt(track)]);
    const forgetMissingArtwork = vi.fn(() => Promise.resolve([track]));

    await scanMusicLibrary({
      libraryId: 'lib',
      root: '/music',
      store: { ...store, forgetMissingArtwork },
      artwork: keptArtwork(),
      isPartial: true,
      files: filesWith([fileAt(track)], { [track]: tagsFor() }),
    });

    expect(forgetMissingArtwork).not.toHaveBeenCalled();
  });

  it('removes what is no longer on the disk and tidies away what that leaves empty', async () => {
    const { store } = memoryStore([storedAt('/music/gone.flac')]);

    const result = await scanMusicLibrary({
      libraryId: 'lib',
      root: '/music',
      store,
      artwork: keptArtwork(),
      files: filesWith([], {}),
    });

    expect(store.removeByPaths).toHaveBeenCalledWith('lib', ['/music/gone.flac']);
    expect(store.prune).toHaveBeenCalledWith('lib');
    expect(result.removed).toBe(1);
  });

  it('keeps tracks under a folder the walk could not read', async () => {
    const { store } = memoryStore([storedAt('/music/Sealed/track.flac')]);

    const result = await scanMusicLibrary({
      libraryId: 'lib',
      root: '/music',
      store,
      artwork: keptArtwork(),
      files: filesWith([], {}, {}, ['/music/Sealed']),
    });

    expect(store.removeByPaths).not.toHaveBeenCalled();
    expect(result.removed).toBe(0);
  });

  it('reads one folder, removing only what is gone from it, without calling it a scan', async () => {
    const { store } = memoryStore([
      storedAt(`${ALBUM}/01 old.mp3`),
      storedAt('/music/Another Album/01.flac'),
    ]);

    await scanMusicLibrary({
      libraryId: 'lib',
      root: ALBUM,
      isPartial: true,
      store,
      artwork: keptArtwork(),
      files: filesWith([fileAt(`${ALBUM}/01.flac`)], {
        [`${ALBUM}/01.flac`]: tagsFor({ releaseGroupMusicbrainzId: 'group' }),
      }),
    });

    expect(store.removeByPaths).toHaveBeenCalledWith('lib', [`${ALBUM}/01 old.mp3`]);
    expect(store.keepAlbum).toHaveBeenCalledWith(
      expect.objectContaining({ releaseGroupMusicbrainzId: 'group' }),
    );
    expect(store.markScanned).not.toHaveBeenCalled();
  });

  it('reports a file it could not read as a track', async () => {
    const onProblem = vi.fn();
    const { store } = memoryStore();

    const result = await scanMusicLibrary({
      libraryId: 'lib',
      root: '/music',
      store,
      artwork: keptArtwork(),
      files: filesWith([fileAt('/music/broken.mp3')], { '/music/broken.mp3': null }),
      onProblem,
    });

    expect(result.failed).toBe(1);
    expect(onProblem).toHaveBeenCalledWith('/music/broken.mp3', expect.any(String));
  });

  it('keeps an album’s cover from inside its first track, once', async () => {
    const { store } = memoryStore();
    const artwork = keptArtwork();
    const picture = { bytes: new Uint8Array([1]), contentType: 'image/jpeg' };
    const one = `${ALBUM}/01.flac`;
    const two = `${ALBUM}/02.flac`;

    await scanMusicLibrary({
      libraryId: 'lib',
      root: '/music',
      store,
      artwork,
      files: filesWith([fileAt(one), fileAt(two)], {
        [one]: tagsFor({ picture }),
        [two]: tagsFor({ picture, trackNumber: 2 }),
      }),
    });

    expect(artwork.keep).toHaveBeenCalledTimes(1);
    expect(artwork.keep).toHaveBeenCalledWith('album', 'album-1', { picture });
    expect(store.setAlbumArtwork).toHaveBeenCalledWith('album-1', '/cache/album-album-1.webp');
  });

  it('falls back to the cover image in the album’s folder', async () => {
    const { store } = memoryStore();
    const artwork = keptArtwork();
    const track = `${ALBUM}/01.flac`;

    await scanMusicLibrary({
      libraryId: 'lib',
      root: '/music',
      store,
      artwork,
      files: filesWith(
        [fileAt(track)],
        { [track]: tagsFor() },
        { findFolderArt: () => Promise.resolve(`${ALBUM}/cover.jpg`) },
      ),
    });

    expect(artwork.keep).toHaveBeenCalledWith('album', 'album-1', { path: `${ALBUM}/cover.jpg` });
  });

  it('pictures an artist from the image kept beside their albums', async () => {
    const { store } = memoryStore();
    const artwork = keptArtwork();
    const track = `${ALBUM}/01.flac`;

    await scanMusicLibrary({
      libraryId: 'lib',
      root: '/music',
      store,
      artwork,
      files: filesWith(
        [fileAt(track)],
        { [track]: tagsFor() },
        { findArtistImage: () => Promise.resolve('/music/artist.jpg') },
      ),
    });

    expect(store.setArtistImage).toHaveBeenCalledWith('artist-1', '/cache/artist-artist-1.webp');
  });

  it('reads lyrics from beside the track where its tags have none', async () => {
    const { store, tracks } = memoryStore();
    const track = `${ALBUM}/01.flac`;

    await scanMusicLibrary({
      libraryId: 'lib',
      root: '/music',
      store,
      artwork: keptArtwork(),
      files: filesWith(
        [fileAt(track)],
        { [track]: tagsFor() },
        { readSidecarLyrics: () => Promise.resolve('[00:01.00]Words') },
      ),
    });

    expect(tracks[0]?.lyrics).toBe('[00:01.00]Words');
  });

  it('prefers the lyrics in the tags over a file beside the track', async () => {
    const { store, tracks } = memoryStore();
    const track = `${ALBUM}/01.flac`;

    await scanMusicLibrary({
      libraryId: 'lib',
      root: '/music',
      store,
      artwork: keptArtwork(),
      files: filesWith(
        [fileAt(track)],
        { [track]: tagsFor({ lyrics: 'Tagged' }) },
        { readSidecarLyrics: () => Promise.resolve('Beside') },
      ),
    });

    expect(tracks[0]?.lyrics).toBe('Tagged');
  });

  it('stops where the scan is cancelled', async () => {
    const { store, tracks } = memoryStore();
    const track = `${ALBUM}/01.flac`;

    await scanMusicLibrary({
      libraryId: 'lib',
      root: '/music',
      store,
      artwork: keptArtwork(),
      isCancelled: () => true,
      files: filesWith([fileAt(track)], { [track]: tagsFor() }),
    });

    expect(tracks).toHaveLength(0);
  });

  it('reads a track again when lyrics are dropped in beside it later', async () => {
    const track = `${ALBUM}/05. Caramel.flac`;
    const lyrics = `${ALBUM}/05. Caramel.lrc`;
    const { store, tracks } = memoryStore([storedAt(track)]);

    await scanMusicLibrary({
      libraryId: 'lib',
      root: '/music',
      store,
      artwork: keptArtwork(),
      files: filesWith(
        [fileAt(track), fileAt(lyrics, 20, 99)],
        { [track]: tagsFor() },
        { readSidecarLyrics: () => Promise.resolve('[00:01.00]Words') },
      ),
    });

    expect(tracks[0]).toMatchObject({ lyrics: '[00:01.00]Words', lyricsModifiedAtMs: 99 });
  });

  it('leaves a track alone whose lyrics file has not changed', async () => {
    const track = `${ALBUM}/05. Caramel.flac`;
    const { store, tracks } = memoryStore([storedAt(track, 99)]);

    await scanMusicLibrary({
      libraryId: 'lib',
      root: '/music',
      store,
      artwork: keptArtwork(),
      files: filesWith([fileAt(track), fileAt(`${ALBUM}/05. Caramel.lrc`, 20, 99)], {
        [track]: tagsFor(),
      }),
    });

    expect(tracks).toHaveLength(0);
  });

  it('reads a track again when its lyrics file is taken away', async () => {
    const track = `${ALBUM}/05. Caramel.flac`;
    const { store, tracks } = memoryStore([storedAt(track, 99)]);

    await scanMusicLibrary({
      libraryId: 'lib',
      root: '/music',
      store,
      artwork: keptArtwork(),
      files: filesWith([fileAt(track)], { [track]: tagsFor() }),
    });

    expect(tracks[0]).toMatchObject({ lyrics: null, lyricsModifiedAtMs: null });
  });
});
