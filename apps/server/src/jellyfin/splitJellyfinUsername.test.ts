import { describe, expect, it } from 'vitest';
import { splitJellyfinUsername } from './splitJellyfinUsername';

describe('splitJellyfinUsername', () => {
  it('reads an account alone as its owner', () => {
    expect(splitJellyfinUsername(' marnie@example.com ')).toEqual({
      identifier: 'marnie@example.com',
      profileName: null,
    });
  });

  it('reads the profile after a #', () => {
    expect(splitJellyfinUsername('marnie#Kid Two')).toEqual({
      identifier: 'marnie',
      profileName: 'Kid Two',
    });
  });

  it('reads an empty profile as none', () => {
    expect(splitJellyfinUsername('marnie#').profileName).toBeNull();
  });
});
