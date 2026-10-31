import { describe, expect, it } from 'vitest';
import { placesAsked } from './placesAsked';

describe('placesAsked', () => {
  it('sends an app built before it named places only the places every app draws', () => {
    expect([...placesAsked(undefined)]).toEqual(['title', 'series', 'album', 'artist', 'playlist']);
  });

  it('sends an app the places it names that Valence knows, and nothing it does not', () => {
    expect([...placesAsked('title,book,somewhere')]).toEqual(['title', 'book']);
    expect([...placesAsked('')]).toEqual([]);
  });
});
