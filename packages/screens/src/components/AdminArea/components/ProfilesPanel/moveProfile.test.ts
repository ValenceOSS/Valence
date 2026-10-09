import { describe, expect, it } from 'vitest';
import { moveProfile } from './moveProfile';

const PROFILES = [
  { id: 'uhd', kind: 'video' as const },
  { id: 'flac', kind: 'music' as const },
  { id: 'hd', kind: 'video' as const },
];

describe('moveProfile', () => {
  it('swaps a profile with the next of its kind', () => {
    expect(moveProfile(PROFILES, 'hd', -1)).toEqual(['hd', 'flac', 'uhd']);
    expect(moveProfile(PROFILES, 'uhd', 1)).toEqual(['hd', 'flac', 'uhd']);
  });

  it('says nothing where there is no place to move to', () => {
    expect(moveProfile(PROFILES, 'uhd', -1)).toBeNull();
    expect(moveProfile(PROFILES, 'flac', 1)).toBeNull();
    expect(moveProfile(PROFILES, 'nowhere', 1)).toBeNull();
  });
});
