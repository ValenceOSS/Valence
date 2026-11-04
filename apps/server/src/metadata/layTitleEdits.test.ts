import { describe, expect, it } from 'vitest';
import { layTitleEdits } from './layTitleEdits';
import type { EditableColumns } from './EditableColumns';
import type { StoredTitleEdit } from './createTitleEditStore';
import type { TitleField, TitleValue } from '@ValenceContracts/schemas/TitleEdit';

type Noted = { subjectKey: string; field: TitleField; value: TitleValue };

const COLUMNS: EditableColumns = {
  title: 'Pilot',
  sortTitle: null,
  originalTitle: null,
  year: 2020,
  tagline: null,
  overview: null,
  releaseDate: null,
  genres: null,
  tags: null,
  studios: null,
  networks: null,
  certifications: null,
  rating: null,
  rottenTomatoes: null,
  imdbId: null,
  tvdbId: null,
  seriesTitle: 'Show',
  seriesSortTitle: null,
};

/**
 * Keeps one edit for a key, and records what the catalogue was noted as saying.
 *
 * @param subjectKey - The title the edit is kept for.
 * @returns The store, and what it was told.
 */
const aStore = (subjectKey: string) => {
  const noted: Noted[] = [];
  const edit: StoredTitleEdit = {
    subjectKey,
    subjectKind: 'show',
    field: 'title',
    value: 'My show',
    catalogue: 'Show',
    catalogueChangedAt: null,
    setAt: new Date(0),
    setBy: null,
  };

  return {
    noted,
    store: {
      editsFor: (_library: string, keys: readonly string[]) =>
        Promise.resolve(keys.includes(subjectKey) ? [edit] : []),
      noteCatalogue: (_library: string, said: readonly Noted[]) => {
        noted.push(...said);

        return Promise.resolve();
      },
    },
  };
};

describe('layTitleEdits', () => {
  it('lays a programme’s edit over an episode, and notes the catalogue’s value under it', async () => {
    const { store, noted } = aStore('tv:1');
    const laid = await layTitleEdits(
      store,
      'lib',
      { kind: 'episode', show: 'tv:1', season: 'tv:1:s1', episode: 'tv:1:e7' },
      COLUMNS,
    );

    await laid.noteCatalogue();

    expect(laid.columns.seriesTitle).toBe('My show');
    expect(noted).toEqual([{ subjectKey: 'tv:1', field: 'title', value: 'Show' }]);
  });

  it('leaves an extra alone', async () => {
    const { store } = aStore('tv:1');
    const laid = await layTitleEdits(store, 'lib', { kind: 'none' }, COLUMNS);

    expect(laid.columns).toEqual(COLUMNS);
  });
});
