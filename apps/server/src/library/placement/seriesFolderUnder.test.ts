import { describe, expect, it } from 'vitest';
import { seriesFolderUnder } from './seriesFolderUnder';

describe('seriesFolderUnder', () => {
  it('finds the programme folder of a season folder', () => {
    expect(seriesFolderUnder('/media/anime', '/media/anime/Frieren (2023)/Season 1')).toBe(
      '/media/anime/Frieren (2023)',
    );
  });

  it('takes a programme folder as its own', () => {
    expect(seriesFolderUnder('/media/anime/', '/media/anime/Frieren (2023)')).toBe(
      '/media/anime/Frieren (2023)',
    );
  });

  it('has nothing for the top folder or a folder outside the library', () => {
    expect(seriesFolderUnder('/media/anime', '/media/anime')).toBeNull();
    expect(seriesFolderUnder('/media/anime', '/media/animes/Other')).toBeNull();
  });
});
