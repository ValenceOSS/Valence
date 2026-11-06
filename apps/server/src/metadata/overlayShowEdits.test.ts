import { describe, expect, it } from 'vitest';
import { overlayShowEdits } from './overlayShowEdits';
import type { StoredTitleEdit } from './createTitleEditStore';
import type { TitleField, TitleValue } from '@ValenceContracts/schemas/TitleEdit';

const SHAPE = {
  seasons: [
    { seasonNumber: 1, episodeCount: 2, name: 'Season 1', overview: null, episodes: [] },
    { seasonNumber: 2, episodeCount: 2, name: 'Season 2', overview: null, episodes: [] },
  ],
  overview: 'What the catalogue says.',
  status: 'Returning Series',
};

/**
 * An edit kept for one field of one title.
 *
 * @param subjectKey - The title.
 * @param field - The field.
 * @param value - What it was set to.
 * @returns The edit.
 */
const anEdit = (subjectKey: string, field: TitleField, value: TitleValue): StoredTitleEdit => ({
  subjectKey,
  subjectKind: subjectKey.includes(':s') ? 'season' : 'show',
  field,
  value,
  catalogue: null,
  catalogueChangedAt: null,
  setAt: new Date(0),
  setBy: null,
});

describe('overlayShowEdits', () => {
  it('lays a programme’s and a season’s edits over the catalogue’s record', () => {
    const laid = overlayShowEdits(SHAPE, 'tv:1', [
      anEdit('tv:1', 'overview', 'My overview.'),
      anEdit('tv:1', 'status', 'Ended'),
      anEdit('tv:1:s2', 'title', 'The second part'),
    ]);

    expect(laid).toMatchObject({
      overview: 'My overview.',
      status: 'Ended',
      seasons: [{ name: 'Season 1' }, { name: 'The second part' }],
    });
  });

  it('keeps the catalogue’s record as it is where nothing was edited', () => {
    expect(overlayShowEdits(SHAPE, 'tv:1', [anEdit('tv:9', 'overview', 'Elsewhere.')])).toEqual(
      SHAPE,
    );
  });

  it('gives an unmatched programme the overview written for it', () => {
    expect(
      overlayShowEdits(null, 'series:folder:Show', [
        anEdit('series:folder:Show', 'overview', 'Written by hand.'),
      ]),
    ).toEqual({ seasons: [], overview: 'Written by hand.', status: null });
    expect(overlayShowEdits(null, 'series:folder:Show', [])).toBeNull();
  });
});
