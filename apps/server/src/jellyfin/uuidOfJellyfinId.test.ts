import { describe, expect, it } from 'vitest';
import { uuidOfJellyfinId } from './uuidOfJellyfinId';

describe('uuidOfJellyfinId', () => {
  it('reads thirty-two digits as a UUID', () => {
    expect(uuidOfJellyfinId('0f8fad5bd9cb469fa16570867728950e')).toBe(
      '0f8fad5b-d9cb-469f-a165-70867728950e',
    );
  });

  it('takes a UUID sent back with its dashes, in either case', () => {
    expect(uuidOfJellyfinId('0F8FAD5B-D9CB-469F-A165-70867728950E')).toBe(
      '0f8fad5b-d9cb-469f-a165-70867728950e',
    );
  });

  it('refuses anything that is not one', () => {
    expect(uuidOfJellyfinId('not-an-id')).toBeNull();
    expect(uuidOfJellyfinId('0f8fad5bd9cb469fa16570867728950')).toBeNull();
  });
});
