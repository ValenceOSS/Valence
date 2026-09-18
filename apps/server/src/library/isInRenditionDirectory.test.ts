import { describe, expect, it } from 'vitest';
import { RENDITION_DIRECTORY, isInRenditionDirectory } from './isInRenditionDirectory';

describe('isInRenditionDirectory', () => {
  it('knows a file Valence keeps beside the film it came from', () => {
    expect(
      isInRenditionDirectory('/media/Films/Azkaban (2004)/.valence/1080p.mkv'),
    ).toBe(true);
  });

  it('knows one kept further down, where a show keeps them per season', () => {
    expect(
      isInRenditionDirectory('/media/Shows/Fringe/Season 1/.valence/s01e01-720p.mkv'),
    ).toBe(true);
  });

  it('leaves the library alone', () => {
    expect(isInRenditionDirectory('/media/Films/Azkaban (2004)/Azkaban (2004).mkv')).toBe(false);
  });

  it('does not mistake a film whose name merely contains the word', () => {
    expect(isInRenditionDirectory('/media/Films/The .valence Story/film.mkv')).toBe(false);
  });

  it('is named for the directory it looks for', () => {
    expect(RENDITION_DIRECTORY).toBe('.valence');
  });
});
