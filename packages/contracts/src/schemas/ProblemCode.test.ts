import { describe, expect, it } from 'vitest';
import { PROBLEM_CODES, ProblemCodeFieldSchema, ProblemCodeSchema } from './ProblemCode';

describe('ProblemCodeSchema', () => {
  it('reads every code, and nothing else', () => {
    for (const code of PROBLEM_CODES) {
      expect(ProblemCodeSchema.parse(code)).toBe(code);
    }

    expect(ProblemCodeSchema.safeParse('SomethingElse').success).toBe(false);
  });

  it('reads a code it does not know, or none at all, as no code, so a newer service never breaks an older one', () => {
    expect(ProblemCodeFieldSchema.parse('VpnDown')).toBe('VpnDown');
    expect(ProblemCodeFieldSchema.parse('SomethingNewer')).toBeNull();
    expect(ProblemCodeFieldSchema.parse(undefined)).toBeNull();
    expect(ProblemCodeFieldSchema.parse(null)).toBeNull();
  });
});
