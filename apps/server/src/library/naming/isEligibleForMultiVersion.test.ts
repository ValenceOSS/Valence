import { describe, expect, it } from 'vitest';
import { isEligibleForMultiVersion } from './isEligibleForMultiVersion';

const CASES: [string, string, boolean][] = [
  ['Heat (1995)', 'Heat (1995)', true],
  ['Heat (1995)', 'Heat (1995) - 1080p', true],
  ['Heat (1995)', "Heat (1995) - Director's Cut", true],
  ['Heat (1995)', 'Heat (1995) [4K]', true],
  ['Heat (1995)', 'heat (1995) - 720p', true],
  ['Heat (1995)', 'Heat (1995) 1080p', false],
  ['Alien', 'Aliens', false],
  ['Dune', 'Dune (1984)', false],
  ['Heat', 'Heat.Directors.Cut', true],
  ['Up', 'Up - 1080p', true],
  ['Movie', 'Different Movie', false],
];

describe('isEligibleForMultiVersion', () => {
  it.each(CASES)('reads %j and %j as versions: %j', (folder, stem, eligible) => {
    expect(isEligibleForMultiVersion(folder, stem)).toBe(eligible);
  });
});
