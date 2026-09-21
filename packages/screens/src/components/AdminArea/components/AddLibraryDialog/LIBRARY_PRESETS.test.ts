import { describe, expect, it } from 'vitest';
import { LIBRARY_KINDS } from '@ValenceContracts/schemas/Library';
import { LIBRARY_PRESETS } from './LIBRARY_PRESETS';

describe('LIBRARY_PRESETS', () => {
  it('offers every kind of library as it is, so nothing has to be called something else', () => {
    for (const kind of LIBRARY_KINDS) {
      expect(
        LIBRARY_PRESETS.some((preset) => preset.kind === kind && preset.flavour === null),
      ).toBe(true);
    }
  });

  it('reads anime as a show and manga as a book, under their own names', () => {
    expect(LIBRARY_PRESETS.find((preset) => preset.id === 'anime')).toMatchObject({
      kind: 'shows',
      flavour: 'Anime',
    });
    expect(LIBRARY_PRESETS.find((preset) => preset.id === 'manga')).toMatchObject({
      kind: 'books',
      flavour: 'Manga',
    });
  });

  it('gives every preset its own id', () => {
    expect(new Set(LIBRARY_PRESETS.map((preset) => preset.id)).size).toBe(LIBRARY_PRESETS.length);
  });
});
