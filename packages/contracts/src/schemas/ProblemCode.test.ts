import { describe, expect, it } from 'vitest';
import { PROBLEM_CODES, ProblemCodeSchema } from './ProblemCode';

describe('ProblemCodeSchema', () => {
  it('reads every code, and nothing else', () => {
    for (const code of PROBLEM_CODES) {
      expect(ProblemCodeSchema.parse(code)).toBe(code);
    }

    expect(ProblemCodeSchema.safeParse('SomethingElse').success).toBe(false);
  });
});
