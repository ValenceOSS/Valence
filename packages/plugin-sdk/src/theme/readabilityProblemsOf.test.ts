import { describe, expect, it } from 'vitest';
import { aTheme } from '@ValenceSDK/testing/aTheme';
import { readabilityProblemsOf } from './readabilityProblemsOf';

describe('readabilityProblemsOf', () => {
  it('finds nothing wrong with colours that read well', () => {
    expect(readabilityProblemsOf(aTheme())).toEqual([]);
  });

  it('says which pair is too close, how close, and how far apart it needs to be', () => {
    const problems = readabilityProblemsOf(aTheme({ text: '#1a1a1a' }));

    expect(problems).toHaveLength(2);
    expect(problems[0]).toMatch(/^text on surface is 1\.\d\d:1, and needs at least 4\.5:1$/u);
    expect(problems[1]).toMatch(/^text on surfaceRaised is 1\.\d\d:1, and needs at least 4\.5:1$/u);
  });

  it('checks the accent’s own ink and muted text at their own thresholds', () => {
    const problems = readabilityProblemsOf(aTheme({ accentContrast: '#3b82f7', textMuted: '#333333' }));

    expect(problems.some((problem) => problem.startsWith('accentContrast on accent'))).toBe(true);
    expect(problems.some((problem) => problem.startsWith('textMuted on surface') && problem.endsWith('at least 3:1'))).toBe(true);
  });
});
