import { describe, expect, it } from 'vitest';
import { describeLibraryEntries } from './describeLibraryEntries';
import type { EntryFacts } from './describeLibraryEntries';

const LIBRARY = { id: 'lib', path: '/media/films' };

const FACTS: EntryFacts = {
  media: {
    '/media/films/Arrival/Arrival.mkv': {
      id: 'arrival',
      rootId: 'arrival',
      seriesId: null,
      title: 'Arrival',
      seriesTitle: null,
      isMatched: true,
      isExtra: false,
    },
    '/media/films/Arrival/Arrival 4K.mkv': {
      id: 'arrival-4k',
      rootId: 'arrival',
      seriesId: null,
      title: 'Arrival',
      seriesTitle: null,
      isMatched: true,
      isExtra: false,
    },
    '/media/films/Home Video.mkv': {
      id: 'home',
      rootId: 'home',
      seriesId: null,
      title: 'Home Video',
      seriesTitle: null,
      isMatched: false,
      isExtra: false,
    },
    '/media/films/Show/S01E01.mkv': {
      id: 'pilot',
      rootId: 'pilot',
      seriesId: 'show',
      title: 'Pilot',
      seriesTitle: 'Show',
      isMatched: true,
      isExtra: false,
    },
  },
  shows: { '/media/films/Show': { seriesId: 'show', title: 'Show' } },
  films: { '/media/films/Arrival': { rootId: 'arrival', title: 'Arrival' } },
  leftOut: [{ path: '/media/films/Junk', isFolder: true }],
  issues: {
    '/media/films/Broken.mkv': { code: 'x', message: 'No video stream', values: {} },
  },
};

/**
 * One listed entry.
 *
 * @param path - Where it is.
 * @param isFolder - Whether it is a folder.
 * @returns The entry.
 */
const at = (path: string, isFolder = false) => ({
  path,
  name: path.split('/').at(-1) ?? path,
  isFolder,
});

describe('describeLibraryEntries', () => {
  it('names the title a file or a programme’s folder belongs to, as Media opens it', () => {
    const described = describeLibraryEntries(
      [
        at('/media/films/Arrival/Arrival 4K.mkv'),
        at('/media/films/Show/S01E01.mkv'),
        at('/media/films/Show', true),
        at('/media/films/Arrival', true),
      ],
      LIBRARY,
      FACTS,
    );

    expect(described['/media/films/Arrival']).toMatchObject({
      title: 'Arrival',
      titleId: 'arrival',
    });

    expect(described['/media/films/Arrival/Arrival 4K.mkv']).toMatchObject({
      mediaId: 'arrival-4k',
      title: 'Arrival',
      titleId: 'arrival',
      status: 'inLibrary',
    });
    expect(described['/media/films/Show/S01E01.mkv']).toMatchObject({
      title: 'Show',
      titleId: 'series lib show',
    });
    expect(described['/media/films/Show']).toMatchObject({ title: 'Show', status: null });
  });

  it('says why a video is not in the library', () => {
    const described = describeLibraryEntries(
      [
        at('/media/films/Home Video.mkv'),
        at('/media/films/Junk/Old.mkv'),
        at('/media/films/Arrival/Sample/arrival-sample.mkv'),
        at('/media/films/metadata/thing.mkv'),
        at('/media/films/Broken.mkv'),
        at('/media/films/New.mkv'),
      ],
      LIBRARY,
      FACTS,
    );

    expect(Object.values(described).map((one) => one.status)).toEqual([
      'unmatched',
      'leftOut',
      'sample',
      'skipped',
      'unreadable',
      'notReadYet',
    ]);
    expect(described['/media/films/Broken.mkv']?.reason).toMatchObject({
      message: 'No video stream',
    });
  });

  it('puts subtitles and pictures with their video, and says when the video is gone', () => {
    const described = describeLibraryEntries(
      [
        at('/media/films/Arrival/Arrival.mkv'),
        at('/media/films/Arrival/Arrival.en.srt'),
        at('/media/films/Arrival/Gone.en.srt'),
        at('/media/films/Arrival/notes.txt'),
      ],
      LIBRARY,
      FACTS,
    );

    expect(described['/media/films/Arrival/Arrival.en.srt']).toMatchObject({
      status: 'sidecar',
      belongsTo: 'Arrival.mkv',
    });
    expect(described['/media/films/Arrival/Gone.en.srt']?.status).toBe('orphaned');
    expect(described['/media/films/Arrival/notes.txt']?.status).toBe('notAVideo');
  });
});
