import { describe, expect, it } from 'vitest';
import { PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import { colourOfTheNextProfile } from './colourOfTheNextProfile';

describe('colourOfTheNextProfile', () => {
  it('takes the colours in turn', () => {
    expect(colourOfTheNextProfile(0)).toBe(PROFILE_COLOURS[0]);
    expect(colourOfTheNextProfile(1)).toBe(PROFILE_COLOURS[1]);
  });

  it('starts again once every colour has been used', () => {
    expect(colourOfTheNextProfile(PROFILE_COLOURS.length)).toBe(PROFILE_COLOURS[0]);
  });
});
