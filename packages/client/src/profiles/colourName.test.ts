import { describe, expect, it } from 'vitest';
import { PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import { colourName } from './colourName';

describe('colourName', () => {
  it('names each ready colour, each differently', () => {
    const names = PROFILE_COLOURS.map(colourName);

    expect(colourName('#E8503A')).toBe('Red');
    expect(new Set(names).size).toBe(PROFILE_COLOURS.length);
    expect(names.some((name) => name.startsWith('#'))).toBe(false);
  });

  it('gives somebody’s own colour as its hex code', () => {
    expect(colourName('#123456')).toBe('#123456');
  });
});
