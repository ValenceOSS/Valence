import { describe, expect, it } from 'vitest';
import { PROBLEM_CODES } from '@ValenceContracts/schemas/ProblemCode';
import { docsFor } from './docsFor';

describe('docsFor', () => {
  it('points a problem at the section of the docs about it', () => {
    expect(docsFor('MayNotWriteToLibrary')).toBe(
      'https://docs.getvalence.app/install/requesting#who-owns-what-it-files',
    );
  });

  it('has somewhere for every problem', () => {
    for (const code of PROBLEM_CODES) {
      expect(docsFor(code)).toMatch(/^https:\/\/docs\.getvalence\.app\/[a-z-]+\/[a-z-]+#[a-z-]+$/u);
    }
  });

  it('has nowhere for a problem with no code', () => {
    expect(docsFor(null)).toBeNull();
    expect(docsFor(undefined)).toBeNull();
  });
});
