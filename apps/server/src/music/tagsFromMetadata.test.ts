import { describe, expect, it } from 'vitest';
import { tagsFromMetadata, titleFromFileName } from './tagsFromMetadata';
import type { IAudioMetadata } from 'music-metadata';

const metadata = (
  common: Partial<IAudioMetadata['common']> = {},
  format: Partial<IAudioMetadata['format']> = {},
): IAudioMetadata => ({
  common: {
    track: { no: 1, of: 10 },
    disk: { no: null, of: null },
    movementIndex: { no: null, of: null },
    ...common,
  },
  format: {
    tagTypes: [],
    trackInfo: [],
    container: 'FLAC',
    codec: 'FLAC',
    lossless: true,
    bitsPerSample: 24,
    sampleRate: 44_100,
    duration: 466.46,
    bitrate: 1_492_495,
    hasAudio: true,
    hasVideo: false,
    ...format,
  },
  native: {},
  quality: { warnings: [] },
});

describe('tagsFromMetadata', () => {
  it('reads what the tags say a track is', () => {
    const tags = tagsFromMetadata(
      metadata({
        title: 'Look To Windward',
        artists: ['Sleep Token'],
        albumartists: ['Sleep Token'],
        album: 'Even In Arcadia',
        year: 2025,
        genre: ['Pop, Rock'],
      }),
      '/music/Even In Arcadia/01. Look To Windward.flac',
    );

    expect(tags).toMatchObject({
      title: 'Look To Windward',
      artists: ['Sleep Token'],
      albumArtists: ['Sleep Token'],
      album: 'Even In Arcadia',
      year: 2025,
      genres: ['Pop', 'Rock'],
      trackNumber: 1,
      discNumber: null,
      codec: 'flac',
      container: 'flac',
      isLossless: true,
      bitDepth: 24,
      sampleRate: 44_100,
      bitrateKbps: 1492,
    });
    expect(tags.durationSeconds).toBeCloseTo(466.46);
  });

  it('names a track from its file where its tags do not', () => {
    expect(tagsFromMetadata(metadata(), '/music/x/03. Past Self.flac').title).toBe('Past Self');
  });

  it('credits a guest named in the artist tag', () => {
    expect(tagsFromMetadata(metadata({ artist: 'Drake feat. Rihanna' }), '/a.mp3').artists).toEqual(
      ['Drake', 'Rihanna'],
    );
  });

  it('prefers the front cover out of several pictures', () => {
    const back = { format: 'image/png', type: 'Cover (back)', data: new Uint8Array([1]) };
    const front = { format: 'image/jpeg', type: 'Cover (front)', data: new Uint8Array([2]) };

    expect(tagsFromMetadata(metadata({ picture: [back, front] }), '/a.flac').picture).toEqual({
      bytes: new Uint8Array([2]),
      contentType: 'image/jpeg',
    });
  });

  it('has no picture where the tags carry none', () => {
    expect(tagsFromMetadata(metadata(), '/a.flac').picture).toBeNull();
  });

  it('writes lyrics that follow the song out as LRC', () => {
    const tags = tagsFromMetadata(
      metadata({
        lyrics: [
          {
            contentType: 1,
            timeStampFormat: 2,
            syncText: [
              { text: 'First', timestamp: 1500 },
              { text: 'Second', timestamp: 62_030 },
            ],
          },
        ],
      }),
      '/a.mp3',
    );

    expect(tags.lyrics).toBe('[00:01.50]First\n[01:02.03]Second');
  });

  it('keeps plain lyrics as they were written', () => {
    const tags = tagsFromMetadata(
      metadata({ lyrics: [{ contentType: 1, timeStampFormat: 2, syncText: [], text: 'Words' }] }),
      '/a.mp3',
    );

    expect(tags.lyrics).toBe('Words');
  });

  it('marks a compilation, so its album can belong to various artists', () => {
    expect(tagsFromMetadata(metadata({ compilation: true }), '/a.flac').isCompilation).toBe(true);
  });

  it('reads a lossy file as lossy', () => {
    const tags = tagsFromMetadata(
      metadata({}, { container: 'MPEG', codec: 'MPEG 1 Layer 3', lossless: false }),
      '/a.mp3',
    );

    expect(tags.isLossless).toBe(false);
    expect(tags.codec).toBe('mpeg 1 layer 3');
  });

  it('carries the MusicBrainz ids a tagger wrote', () => {
    const tags = tagsFromMetadata(
      metadata({ musicbrainz_albumid: 'album-1', musicbrainz_albumartistid: ['artist-1'] }),
      '/a.flac',
    );

    expect(tags.albumMusicbrainzId).toBe('album-1');
    expect(tags.artistMusicbrainzIds).toEqual(['artist-1']);
  });
});

describe('titleFromFileName', () => {
  it('drops the track number a rip is named with', () => {
    expect(titleFromFileName('01. Look To Windward.flac')).toBe('Look To Windward');
    expect(titleFromFileName('1-02 - Emergence.mp3')).toBe('Emergence');
    expect(titleFromFileName('07 Provider.m4a')).toBe('Provider');
  });

  it('keeps a name that is only a number', () => {
    expect(titleFromFileName('1979.mp3')).toBe('1979');
  });
});
