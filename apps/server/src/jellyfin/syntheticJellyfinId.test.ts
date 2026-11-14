import { describe, expect, it } from 'vitest';
import { syntheticJellyfinId } from './syntheticJellyfinId';

describe('syntheticJellyfinId', () => {
  it('gives the same thing the same identifier every time', () => {
    expect(syntheticJellyfinId('show', 'a:twin-peaks')).toBe(
      syntheticJellyfinId('show', 'a:twin-peaks'),
    );
    expect(syntheticJellyfinId('show', 'a:twin-peaks')).toMatch(/^[0-9a-f]{32}$/u);
  });

  it('tells different things and different kinds apart', () => {
    expect(syntheticJellyfinId('show', 'a')).not.toBe(syntheticJellyfinId('show', 'b'));
    expect(syntheticJellyfinId('show', 'a')).not.toBe(syntheticJellyfinId('season', 'a'));
  });
});
