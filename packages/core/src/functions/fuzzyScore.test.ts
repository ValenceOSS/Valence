import { describe, expect, it } from 'vitest';
import { fuzzyScore } from './fuzzyScore';

const NAME = 'Add a download client Downloads';

describe('fuzzyScore', () => {
  it('finds a name by the start of any of its words', () => {
    expect(fuzzyScore('add', NAME)).not.toBeNull();
    expect(fuzzyScore('download client', NAME)).not.toBeNull();
  });

  it('finds a name by its letters in order, forgivingly', () => {
    expect(fuzzyScore('dl clnt', NAME)).not.toBeNull();
  });

  it('finds nothing where a word typed is not there at all', () => {
    expect(fuzzyScore('webhook', NAME)).toBeNull();
    expect(fuzzyScore('add webhook', NAME)).toBeNull();
  });

  it('scores a word at the start of the name above one found inside it', () => {
    const atTheStart = fuzzyScore('add', 'Add a library');
    const inside = fuzzyScore('add', 'Library to add');
    const loosely = fuzzyScore('ad', 'Load a file');

    expect(atTheStart).toBeGreaterThan(inside ?? 0);
    expect(inside).toBeGreaterThan(loosely ?? 0);
  });

  it('ignores case and the space around what was typed', () => {
    expect(fuzzyScore('  DOWNLOAD  ', NAME)).toBe(fuzzyScore('download', NAME));
  });
});
