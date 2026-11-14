import { describe, expect, it } from 'vitest';
import { showJellyfinId } from './showJellyfinId';

describe('showJellyfinId', () => {
  it('is the same for the same programme in the same library, and differs across libraries', () => {
    expect(showJellyfinId('a', 'x')).toBe(showJellyfinId('a', 'x'));
    expect(showJellyfinId('a', 'x')).not.toBe(showJellyfinId('b', 'x'));
  });
});
