import { describe, expect, it } from 'vitest';
import { satisfiesApiRange } from './satisfiesApiRange';

describe('whether a plugin works with this server', () => {
  it.each([
    ['^1.0', '1.0.0', true],
    ['^1.0', '1.4.2', true],
    ['^1.2', '1.1.0', false],
    ['^1.0', '2.0.0', false],
    ['~1.2', '1.2.9', true],
    ['~1.2', '1.3.0', false],
    ['1.0.0', '1.0.0', true],
    ['1.0.0', '1.0.1', false],
    ['^1', '1.9.0', true],
    ['^x', '1.0.0', false],
    ['^1.0', 'not a version', false],
  ])('%s against %s is %s', (range, version, expected) => {
    expect(satisfiesApiRange(range, version)).toBe(expected);
  });
});
