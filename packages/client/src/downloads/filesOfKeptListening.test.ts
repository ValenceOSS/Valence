import { describe, expect, it } from 'vitest';
import { aKeptListening } from '@ValenceClient/testing/aKeptListening';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { aTrack } from '@ValenceClient/testing/aTrack';
import {
  filesOfKeptListening,
  keptArtworkName,
  keptChapterPrefix,
  keptTrackPrefix,
} from './filesOfKeptListening';

const PLAYS_ANYTHING = () => true;

const PLAYS_NOTHING = () => false;

/**
 * The name a kept song is given, ending and all.
 *
 * @param codec - What the song's file was read as.
 * @param canPlay - Whether the device plays a kind of file.
 * @returns Its name.
 */
const nameOfASongIn = (codec: string, canPlay = PLAYS_ANYTHING): string | undefined =>
  filesOfKeptListening(
    aKeptListening({ artworkFrom: null, tracks: [aTrack(1, { codec })] }),
    canPlay,
  )[0]?.name;

describe('filesOfKeptListening', () => {
  it('fetches the artwork first, then each song as the file it is', () => {
    expect(filesOfKeptListening(aKeptListening(), PLAYS_ANYTHING)).toEqual([
      {
        name: 'artwork-album-00000000-0000-4000-8000-00000000a1b1.jpg',
        from: '/api/music/albums/00000000-0000-4000-8000-00000000a1b1/artwork',
      },
      {
        name: `track-${aTrack(1).id}-lossless.flac`,
        from: `/api/music/tracks/${aTrack(1).id}/stream?quality=lossless`,
      },
      {
        name: `track-${aTrack(2).id}-lossless.flac`,
        from: `/api/music/tracks/${aTrack(2).id}/stream?quality=lossless`,
      },
    ]);
  });

  it('keeps no artwork for something with none', () => {
    expect(
      filesOfKeptListening(aKeptListening({ artworkFrom: null }), PLAYS_ANYTHING).map(
        (file) => file.name,
      ),
    ).toEqual([`track-${aTrack(1).id}-lossless.flac`, `track-${aTrack(2).id}-lossless.flac`]);
  });

  it('keeps an encode where the device cannot play the file as it is', () => {
    expect(filesOfKeptListening(aKeptListening({ artworkFrom: null }), PLAYS_NOTHING)[0]).toEqual({
      name: `track-${aTrack(1).id}-high.m4a`,
      from: `/api/music/tracks/${aTrack(1).id}/stream?quality=high`,
    });
  });

  it('keeps the high encode where no quality was chosen', () => {
    expect(
      filesOfKeptListening(aKeptListening({ artworkFrom: null, quality: null }), PLAYS_ANYTHING)[0]
        ?.name,
    ).toBe(`track-${aTrack(1).id}-high.m4a`);
  });

  it('gives every encode the same ending, whatever the file was', () => {
    expect(
      filesOfKeptListening(aKeptListening({ artworkFrom: null, quality: 'low' }), PLAYS_ANYTHING)[0]
        ?.name,
    ).toBe(`track-${aTrack(1).id}-low.m4a`);
  });

  it('names a file as it is by the kind of file it is', () => {
    expect(nameOfASongIn('MP3')).toBe(`track-${aTrack(1).id}-lossless.mp3`);
    expect(nameOfASongIn('MPEG 1 Layer 3')).toBe(`track-${aTrack(1).id}-lossless.mp3`);
    expect(nameOfASongIn('aac')).toBe(`track-${aTrack(1).id}-lossless.m4a`);
    expect(nameOfASongIn('alac')).toBe(`track-${aTrack(1).id}-lossless.m4a`);
    expect(nameOfASongIn('opus')).toBe(`track-${aTrack(1).id}-lossless.ogg`);
    expect(nameOfASongIn('vorbis')).toBe(`track-${aTrack(1).id}-lossless.ogg`);
    expect(nameOfASongIn('pcm_s16le')).toBe(`track-${aTrack(1).id}-lossless.wav`);
  });

  it('keeps an encode of a file no device plays', () => {
    expect(nameOfASongIn('wma')).toBe(`track-${aTrack(1).id}-high.m4a`);
  });

  it('keeps an audiobook as its cover and each of its tracks', () => {
    const { book, chapters } = anAudiobook();
    const kept = aKeptListening({
      kind: 'audiobook',
      id: book.id,
      artworkFrom: `/api/books/${book.id}/cover`,
      quality: null,
      tracks: [],
      book,
      chapters,
    });

    expect(filesOfKeptListening(kept, PLAYS_NOTHING)).toEqual([
      { name: `artwork-audiobook-${book.id}.jpg`, from: `/api/books/${book.id}/cover` },
      ...chapters.map((chapter) => ({
        name: `chapter-${chapter.id}.m4b`,
        from: `/api/books/${book.id}/chapters/${chapter.id}/audio`,
      })),
    ]);
  });
});

describe('keptTrackPrefix', () => {
  it('starts every quality of a kept song the same way', () => {
    expect(nameOfASongIn('flac')?.startsWith(keptTrackPrefix(aTrack(1).id))).toBe(true);
    expect(keptTrackPrefix('a')).toBe('track-a-');
  });
});

describe('keptChapterPrefix', () => {
  it('starts a kept audiobook track with its name and a dot', () => {
    expect(keptChapterPrefix('a')).toBe('chapter-a.');
  });
});

describe('keptArtworkName', () => {
  it('names the artwork after what it is the artwork of', () => {
    expect(keptArtworkName({ kind: 'playlist', id: 'p' })).toBe('artwork-playlist-p.jpg');
  });
});
