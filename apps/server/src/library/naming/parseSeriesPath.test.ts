import { describe, expect, it } from 'vitest';
import { parseSeriesPath } from './parseSeriesPath';

const NAMES: [string, string][] = [
  ['The.Show.S01', 'The.Show'],
  ['/The.Show.S01', 'The.Show'],
  ['/some/place/The.Show.S01', 'The.Show'],
  ['/something/The.Show.S01', 'The.Show'],
  ['The Show Season 10', 'The Show'],
  ['The Show S01E01', 'The Show'],
  ['The Show S01E01 Episode', 'The Show'],
  ['/something/The Show/Season 1', 'The Show'],
  ['/something/The Show/S01', 'The Show'],
];

describe('parseSeriesPath', () => {
  it.each(NAMES)('reads %j as %j', (path, name) => {
    expect(parseSeriesPath(path)).toBe(name);
  });

  it('reads nothing from a path that names no season', () => {
    expect(parseSeriesPath('/tv/The Show')).toBeNull();
  });
});
