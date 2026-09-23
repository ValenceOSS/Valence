import { describe, expect, it } from 'vitest';
import { theVersionsOf } from './theVersionsOf';

describe('the versions of a title', () => {
  it('offers the title itself first, as the original', () => {
    expect(theVersionsOf('film', [])).toEqual([{ id: 'film', label: 'Original' }]);
  });

  it('names each other cut by what its filename calls it', () => {
    expect(theVersionsOf('film', [{ id: 'bw', versionLabel: 'B&W' }])).toEqual([
      { id: 'film', label: 'Original' },
      { id: 'bw', label: 'B&W' },
    ]);
  });

  it('names a cut its filename says nothing about plainly', () => {
    expect(theVersionsOf('film', [{ id: 'other', versionLabel: null }])[1]).toEqual({
      id: 'other',
      label: 'Another version',
    });
  });
});
