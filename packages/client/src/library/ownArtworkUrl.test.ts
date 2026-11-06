import { describe, expect, it } from 'vitest';
import { ownArtworkUrl } from './ownArtworkUrl';

describe('ownArtworkUrl', () => {
  it('draws a picture kept on the server through the server', () => {
    expect(ownArtworkUrl('film-1', 'valence-upload:abc')).toBe(
      '/api/media/film-1/artwork/picture?url=valence-upload%3Aabc',
    );
  });

  it('draws a catalogue’s picture from its own address', () => {
    expect(ownArtworkUrl('film-1', 'https://image.test/p.jpg')).toBe('https://image.test/p.jpg');
  });
});
