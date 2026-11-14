import { describe, expect, it } from 'vitest';
import { createJellyfinIdBook } from './createJellyfinIdBook';
import { mediaDetailOfJellyfinItem } from './mediaDetailOfJellyfinItem';
import { aFakeStore } from './testing/aFakeStore';
import { aJellyfinEpisode } from './testing/aJellyfinEpisode';

describe('mediaDetailOfJellyfinItem', () => {
  it('describes the file’s streams, numbered as Jellyfin numbers them, and its story', () => {
    const detail = mediaDetailOfJellyfinItem(
      aJellyfinEpisode(),
      '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      {
        address: 'http://j.test',
        book: createJellyfinIdBook(aFakeStore()),
      },
    );

    expect(detail).toMatchObject({
      container: 'mkv',
      bitrateKbps: 201,
      audioStreams: [{ index: 1, codec: 'aac', channels: 2, language: 'eng' }],
      subtitleStreams: [{ index: 2, format: 'srt', isForced: false }],
      metadata: {
        overview: 'The body of Laura Palmer is found on a riverbank.',
        seriesTitle: 'Twin Peaks',
      },
    });
  });
});
