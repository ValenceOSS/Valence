import { describe, expect, it } from 'vitest';
import { drawingToShow } from './drawingToShow';

describe('drawingToShow', () => {
  it('reads a style clear, whatever colour it is drawn on, so the colour is painted behind it', () => {
    expect(drawingToShow('adventurer', 'dan', '#3a8ee8')).toBe(
      '/api/profiles/avatars/adventurer?seed=dan',
    );
  });

  it('reads a style with its own background already on the colour', () => {
    expect(drawingToShow('thumbs', 'dan', '#3a8ee8')).toBe(
      '/api/profiles/avatars/thumbs?seed=dan&colour=%233a8ee8',
    );
    expect(drawingToShow('funEmoji', 'dan', '#3a8ee8')).toBe(
      '/api/profiles/avatars/funEmoji?seed=dan&colour=%233a8ee8',
    );
  });

  it('reads one clear where it is not on a colour, its own background and all', () => {
    expect(drawingToShow('thumbs', 'dan', null)).toBe('/api/profiles/avatars/thumbs?seed=dan');
  });
});
