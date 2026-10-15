import { describe, expect, it } from 'vitest';
import { ADVISORIES } from '@ValenceContracts/schemas/Advisory';
import { describeAdvisory } from './describeAdvisory';

describe('describeAdvisory', () => {
  it('names what a title contains as a viewer reads it', () => {
    expect(describeAdvisory('language')).toBe('Strong language');
    expect(describeAdvisory('drugs')).toBe('Drug use');
  });

  it('names every advisory there is', () => {
    expect(ADVISORIES.map(describeAdvisory).every((name) => name.length > 0)).toBe(true);
  });
});
