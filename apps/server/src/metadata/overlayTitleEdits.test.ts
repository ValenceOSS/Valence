import { describe, expect, it } from 'vitest';
import { overlayTitleEdits } from './overlayTitleEdits';
import type { EditableColumns } from './EditableColumns';

const SCANNED: EditableColumns = {
  title: 'A film',
  sortTitle: null,
  originalTitle: 'Un film',
  year: 2001,
  tagline: 'The catalogue’s line',
  overview: 'What the catalogue says.',
  releaseDate: '2001-05-04',
  addedAt: null,
  genres: ['Drama'],
  tags: null,
  studios: ['A studio'],
  networks: null,
  certifications: { GB: '12A', US: 'PG-13' },
  rating: 7.1,
  rottenTomatoes: 80,
  imdbId: 'tt0000001',
  tvdbId: null,
  seriesTitle: null,
  seriesSortTitle: null,
};

describe('overlayTitleEdits', () => {
  it('lays a film’s edits over its own columns, and notes what the catalogue said', () => {
    const { columns, catalogue } = overlayTitleEdits(SCANNED, {
      film: [
        { field: 'title', value: 'My title' },
        { field: 'tags', value: ['Kept'] },
        { field: 'releaseDate', value: '1999-12-31' },
      ],
    });

    expect(columns).toMatchObject({
      title: 'My title',
      tags: ['Kept'],
      releaseDate: '1999-12-31',
      year: 1999,
      overview: 'What the catalogue says.',
    });
    expect(catalogue).toEqual([
      { scope: 'film', field: 'title', value: 'A film' },
      { scope: 'film', field: 'tags', value: null },
      { scope: 'film', field: 'releaseDate', value: '2001-05-04' },
    ]);
  });

  it('keeps the day a film was said to be added, over the day a scan would give it', () => {
    const { columns } = overlayTitleEdits(SCANNED, {
      film: [{ field: 'addedAt', value: '2020-01-02' }],
    });

    expect(columns.addedAt).toBe('2020-01-02');
  });

  it('replaces only the countries a content rating was edited for', () => {
    const { columns } = overlayTitleEdits(SCANNED, {
      film: [{ field: 'certifications', value: { GB: '15' } }],
    });

    expect(columns.certifications).toEqual({ GB: '15', US: 'PG-13' });
  });

  it('puts a programme’s title on the column its episodes carry for it, not the episode’s own', () => {
    const { columns } = overlayTitleEdits(
      { ...SCANNED, title: 'An episode', seriesTitle: 'A show' },
      {
        show: [{ field: 'title', value: 'My show' }],
        episode: [{ field: 'overview', value: 'My episode.' }],
      },
    );

    expect(columns).toMatchObject({
      title: 'An episode',
      seriesTitle: 'My show',
      overview: 'My episode.',
    });
  });

  it('passes over an edit that no longer passes its field’s rule', () => {
    const { columns, catalogue } = overlayTitleEdits(SCANNED, {
      film: [{ field: 'rating', value: 42 }],
    });

    expect(columns.rating).toBe(7.1);
    expect(catalogue).toEqual([{ scope: 'film', field: 'rating', value: 7.1 }]);
  });

  it('leaves a field the column does not hold to the title page, such as a note', () => {
    const { columns, catalogue } = overlayTitleEdits(SCANNED, {
      film: [{ field: 'note', value: 'For me.' }],
    });

    expect(columns).toEqual(SCANNED);
    expect(catalogue).toEqual([]);
  });
});
