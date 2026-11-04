import { describe, expect, it } from 'vitest';
import { sortKeyOf } from './sortKeyOf';

describe('sortKeyOf', () => {
  it('files a title under its first word after a leading article', () => {
    expect(sortKeyOf('The Matrix')).toBe('matrix');
    expect(sortKeyOf('A Quiet Place')).toBe('quiet place');
    expect(sortKeyOf('An Officer')).toBe('officer');
  });

  it('leaves a title that only starts like an article as it is', () => {
    expect(sortKeyOf('Theory of Everything')).toBe('theory of everything');
    expect(sortKeyOf('The')).toBe('the');
  });

  it('puts the sort title somebody gave it first', () => {
    expect(sortKeyOf('The Matrix', 'Matrix 1')).toBe('matrix 1');
    expect(sortKeyOf('The Matrix', ' ')).toBe('matrix');
  });
});
