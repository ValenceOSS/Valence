import { describe, expect, it } from 'vitest';
import { PROBLEM_DOCS } from '@ValenceContracts/constants/PROBLEM_DOCS';
import { PROBLEM_CODES } from '@ValenceContracts/schemas/ProblemCode';
import { docsFor } from './docsFor';

describe('docsFor', () => {
  it('points a problem at the steps that put it right', () => {
    expect(docsFor('MayNotWriteToLibrary')).toBe(
      'https://docs.getvalence.app/install/requesting#it-may-not-write-to-a-folder',
    );
  });

  it('has an address for every problem that has steps', () => {
    for (const code of PROBLEM_CODES.filter((one) => one in PROBLEM_DOCS)) {
      expect(docsFor(code)).toMatch(/^https:\/\/docs\.getvalence\.app\/[a-z-]+\/[a-z-]+#[a-z-]+$/u);
    }
  });

  it('has nowhere for a problem with no steps to give', () => {
    expect(docsFor('CloudflareCheckFailed')).toBeNull();
    expect(docsFor('IndexerFailing')).toBeNull();
  });

  it('has nowhere for a problem with no code', () => {
    expect(docsFor(null)).toBeNull();
    expect(docsFor(undefined)).toBeNull();
  });
});
