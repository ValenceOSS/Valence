import { describe, expect, it } from 'vitest';
import { audiobookFromMetadata } from './audiobookFromMetadata';
import type { IAudioMetadata } from 'music-metadata';

const metadata = (
  common: Partial<IAudioMetadata['common']> = {},
  format: Partial<IAudioMetadata['format']> = {},
): IAudioMetadata => ({
  common: {
    track: { no: null, of: null },
    disk: { no: null, of: null },
    movementIndex: { no: null, of: null },
    ...common,
  },
  format: {
    tagTypes: [],
    trackInfo: [],
    container: 'M4B',
    codec: 'AAC',
    lossless: false,
    sampleRate: 44_100,
    duration: 3600,
    hasAudio: true,
    hasVideo: false,
    ...format,
  },
  native: {},
  quality: { warnings: [] },
});

describe('audiobookFromMetadata', () => {
  it('reads the book, its author and its blurb from the tags', () => {
    const heard = audiobookFromMetadata(
      metadata({
        album: 'Dune',
        albumartist: 'Frank Herbert',
        title: 'Dune (Unabridged)',
        description: ['A desert planet.'],
      }),
    );

    expect(heard).toMatchObject({
      layout: 'audio',
      durationSeconds: 3600,
      about: {
        series: 'Dune',
        title: 'Dune (Unabridged)',
        authors: ['Frank Herbert'],
        description: 'A desert planet.',
      },
    });
  });

  it('turns the chapters a file marks into seconds, each running to the next', () => {
    const heard = audiobookFromMetadata(
      metadata(
        {},
        {
          chapters: [
            { title: 'Book Two', start: 1_800_000, timeScale: 1000 },
            { title: 'Book One', start: 0, timeScale: 1000 },
            { title: '', start: 3_000_000, timeScale: 1000 },
          ],
        },
      ),
    );

    expect(heard?.marks).toEqual([
      { title: 'Book One', startSeconds: 0, endSeconds: 1800 },
      { title: 'Book Two', startSeconds: 1800, endSeconds: 3000 },
      { title: 'Chapter 3', startSeconds: 3000, endSeconds: 3600 },
    ]);
  });

  it('counts chapter marks without a timescale in milliseconds, and never past the end', () => {
    const heard = audiobookFromMetadata(
      metadata({}, { duration: 100, chapters: [{ title: 'All of it', start: 0, end: 900_000 }] }),
    );

    expect(heard?.marks).toEqual([{ title: 'All of it', startSeconds: 0, endSeconds: 100 }]);
  });

  it('says where a track comes among the book’s tracks', () => {
    expect(audiobookFromMetadata(metadata({ track: { no: 7, of: 40 } }))?.track).toBe(7);
  });

  it('hands over the front cover it carries', async () => {
    const heard = audiobookFromMetadata(
      metadata({
        picture: [
          { format: 'image/png', data: Uint8Array.from([1]), type: 'Back cover' },
          { format: 'image/jpeg', data: Uint8Array.from([2, 3]), type: 'Cover (front)' },
        ],
      }),
    );

    expect(await heard?.readCover()).toEqual({
      bytes: Uint8Array.from([2, 3]),
      contentType: 'image/jpeg',
    });
  });

  it('reads nothing from a file with no sound in it', () => {
    expect(audiobookFromMetadata(metadata({}, { duration: 0 }))).toBeNull();
    expect(audiobookFromMetadata(metadata({}, { hasAudio: false }))).toBeNull();
  });
});
