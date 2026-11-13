import { describe, expect, it } from 'vitest';
import { isNewCodeProblem } from './isNewCodeProblem';

describe('isNewCodeProblem', () => {
  it('knows the code a page asked for has gone, as each browser says it', () => {
    expect(
      isNewCodeProblem(
        'Failed to fetch dynamically imported module: https://x/assets/Admin-1a2b.js',
      ),
    ).toBe(true);
    expect(isNewCodeProblem('Importing a module script failed.')).toBe(true);
  });

  it('leaves every other failure alone', () => {
    expect(isNewCodeProblem('Failed to fetch')).toBe(false);
    expect(isNewCodeProblem(null)).toBe(false);
  });
});
