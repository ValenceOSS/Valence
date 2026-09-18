import { describe, expect, it } from 'vitest';
import { nameOfOwner } from './nameOfOwner';

describe('nameOfOwner', () => {
  it('calls a playlist by whoever it belongs to', () => {
    expect(
      nameOfOwner({
        profileId: '00000000-0000-4000-8000-000000000001',
        name: 'Dan',
        colour: '#3a8ee8',
      }),
    ).toBe('Dan');
  });

  it('says a profile was removed rather than leaving the line blank', () => {
    expect(nameOfOwner(null)).toBe('a removed profile');
  });
});
