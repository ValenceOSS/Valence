import { describe, expect, it } from 'vitest';
import { columnOfField } from './columnOfField';

describe('columnOfField', () => {
  it('keeps a programme’s title on the column its episodes carry for it', () => {
    expect(columnOfField('film', 'title')).toBe('title');
    expect(columnOfField('show', 'title')).toBe('seriesTitle');
    expect(columnOfField('show', 'sortTitle')).toBe('seriesSortTitle');
    expect(columnOfField('episode', 'title')).toBe('title');
  });

  it('says nothing for a field the file does not hold for that kind of title', () => {
    expect(columnOfField('show', 'overview')).toBeUndefined();
    expect(columnOfField('episode', 'genres')).toBeUndefined();
    expect(columnOfField('film', 'note')).toBeUndefined();
  });
});
