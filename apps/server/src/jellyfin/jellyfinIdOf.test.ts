import { describe, expect, it } from 'vitest';
import { jellyfinIdOf } from './jellyfinIdOf';
import { uuidOfJellyfinId } from './uuidOfJellyfinId';

describe('jellyfinIdOf', () => {
  it('writes a UUID as thirty-two digits with no dashes', () => {
    expect(jellyfinIdOf('0F8FAD5B-D9CB-469F-A165-70867728950E')).toBe(
      '0f8fad5bd9cb469fa16570867728950e',
    );
  });

  it('turns back into the same UUID', () => {
    const id = '0f8fad5b-d9cb-469f-a165-70867728950e';

    expect(uuidOfJellyfinId(jellyfinIdOf(id))).toBe(id);
  });
});
