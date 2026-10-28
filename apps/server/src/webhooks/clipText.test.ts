import { describe, expect, it } from 'vitest';
import { clipText } from './clipText';

describe('clipText', () => {
  it('leaves text that fits as it is', () => {
    expect(clipText('Dune', 4)).toBe('Dune');
  });

  it('cuts text that does not, ending it with an ellipsis inside the limit', () => {
    const clipped = clipText('Dune: Part Two', 8);

    expect(clipped).toBe('Dune: P…');
    expect(clipped).toHaveLength(8);
  });

  it('says nothing where there is no room even for the ellipsis', () => {
    expect(clipText('Dune', 0)).toBe('');
  });

  it('never cuts an emoji in half', () => {
    expect(clipText('ab🎬cd', 4)).toBe('ab…');
  });
});
