import { describe, expect, it } from 'vitest';
import { placeOfArrival } from './placeOfArrival';

describe('placeOfArrival', () => {
  it('opens a film or series over where it is, and music in the music section', () => {
    expect(placeOfArrival('film', 'm1')).toEqual({ inspecting: 'm1', asking: null });
    expect(placeOfArrival('series', 's1')).toEqual({ show: 's1', asking: null });
    expect(placeOfArrival('album', 'a1')).toEqual({
      section: 'music',
      listen: 'album:a1',
      asking: null,
    });
    expect(placeOfArrival('artist', 'a2')).toMatchObject({ listen: 'album:a2' });
  });
});
