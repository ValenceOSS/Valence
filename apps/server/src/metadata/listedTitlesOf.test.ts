import { describe, expect, it } from 'vitest';
import { aListedFile } from '@ValenceServer/testing/aListedFile';
import { listedTitlesOf } from './listedTitlesOf';

const NOTHING = { duplicates: new Map(), duplicatePaths: new Map(), editedKeys: new Set<string>() };

describe('listedTitlesOf', () => {
  it('gathers a film’s versions into one row, saying where their pictures differ', () => {
    const [film] = listedTitlesOf(
      [
        aListedFile('heat', { summary: { title: 'Heat' } }),
        aListedFile('heat-4k', {
          parentId: 'heat',
          sizeBytes: 9000,
          summary: { title: 'Heat', width: 3840, height: 2160, videoRange: 'HDR10' },
        }),
      ],
      NOTHING,
    );

    expect(film?.row).toMatchObject({
      id: 'heat',
      kind: 'film',
      files: 2,
      versions: 1,
      sizeBytes: 10_000,
      folder: '/lib',
      looks: { step: null, isStepMixed: true, isRangeMixed: true, codec: 'h264' },
    });
    expect(film?.maxHeight).toBe(2160);
  });

  it('gathers a programme’s episodes, its lead the first episode', () => {
    const [show] = listedTitlesOf(
      [
        aListedFile('two', {
          path: '/lib/Show/Season 1/two.mkv',
          seriesKey: 'folder:Show',
          summary: { seriesId: 'show', seriesTitle: 'Show', seasonNumber: 1, episodeNumber: 2 },
        }),
        aListedFile('one', {
          path: '/lib/Show/Season 1/one.mkv',
          seriesKey: 'folder:Show',
          summary: { seriesId: 'show', seriesTitle: 'Show', seasonNumber: 1, episodeNumber: 1 },
        }),
      ],
      NOTHING,
    );

    expect(show?.row).toMatchObject({
      id: 'series lib show',
      kind: 'show',
      name: 'Show',
      episodes: 2,
      seasons: 1,
      folder: '/lib/Show',
      durationSeconds: 12_000,
    });
    expect(show?.row.lead.id).toBe('one');
  });

  it('names the files of a title there twice and those that cannot be read', () => {
    const [title] = listedTitlesOf([aListedFile('heat', { summary: { durationSeconds: 0 } })], {
      duplicates: new Map([
        ['heat', 'film:603'],
        ['other', 'film:603'],
      ]),
      duplicatePaths: new Map([
        ['heat', '/lib/heat.mkv'],
        ['other', '/elsewhere/heat.mkv'],
      ]),
      editedKeys: new Set(),
    });

    expect(title?.isTwice).toBe(true);
    expect(title?.isUnreadable).toBe(true);
    expect(title?.row.problemFiles.duplicate).toEqual([
      { id: 'heat', group: 'film:603', path: '/lib/heat.mkv', isOwn: true },
      { id: 'other', group: 'film:603', path: '/elsewhere/heat.mkv', isOwn: false },
    ]);
  });

  it('says a title is edited where edits are kept under its key or any key beneath it', () => {
    const [film] = listedTitlesOf([aListedFile('heat')], {
      ...NOTHING,
      editedKeys: new Set(['movie:603']),
    });
    const [show] = listedTitlesOf(
      [
        aListedFile('pilot', {
          seriesKey: 'folder:Show',
          summary: { seriesId: 'show', seriesTitle: 'Show', seasonNumber: 1, episodeNumber: 1 },
        }),
      ],
      { ...NOTHING, editedKeys: new Set(['tv:603:s1']) },
    );

    expect(film?.row.isEdited).toBe(true);
    expect(show?.row.isEdited).toBe(true);
  });

  it('says a film with no match or no poster needs a look', () => {
    const [unmatched, noPoster] = listedTitlesOf(
      [
        aListedFile('a', { summary: { externalId: null } }),
        aListedFile('b', { summary: { hasPoster: false, externalId: '7' } }),
      ],
      NOTHING,
    );

    expect(unmatched?.needsALook).toBe(true);
    expect(noPoster?.needsALook).toBe(true);
  });
});
