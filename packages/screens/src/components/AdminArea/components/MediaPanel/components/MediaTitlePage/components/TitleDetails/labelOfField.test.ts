import { describe, expect, it } from 'vitest';
import { FIELDS_OF_KIND } from '@ValenceContracts/schemas/TitleEdit';
import { labelOfField } from './labelOfField';

describe('labelOfField', () => {
  it('names a field for the kind of title it belongs to', () => {
    expect(labelOfField('title', 'film')).toBe('Title');
    expect(labelOfField('title', 'season')).toBe('Name');
    expect(labelOfField('releaseDate', 'film')).toBe('Release date');
    expect(labelOfField('releaseDate', 'show')).toBe('First aired');
    expect(labelOfField('releaseDate', 'episode')).toBe('Air date');
  });

  it('names every field every kind of title has', () => {
    for (const kind of ['film', 'show', 'season', 'episode'] as const) {
      for (const field of FIELDS_OF_KIND[kind]) {
        expect(labelOfField(field, kind)).not.toBe('');
      }
    }
  });
});
