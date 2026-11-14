import { describe, expect, it } from 'vitest';
import { personOfJellyfinId } from './personOfJellyfinId';

describe('personOfJellyfinId', () => {
  it('reads a person’s number back', () => {
    expect(personOfJellyfinId('ffffffff000000000000000000000011')).toBe(17);
  });

  it('refuses an identifier that is not a person’s', () => {
    expect(personOfJellyfinId('0f8fad5bd9cb469fa16570867728950e')).toBeNull();
    expect(personOfJellyfinId('ffffffff000000000000000000000000')).toBeNull();
  });
});
