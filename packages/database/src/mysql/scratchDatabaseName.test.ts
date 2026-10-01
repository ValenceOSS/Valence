import { afterEach, describe, expect, it } from 'vitest';
import { scratchDatabaseName } from './scratchDatabaseName';

const BEFORE = process.env.VALENCE_SCRATCH_PREFIX;

afterEach(() => {
  if (BEFORE === undefined) {
    delete process.env.VALENCE_SCRATCH_PREFIX;
  } else {
    process.env.VALENCE_SCRATCH_PREFIX = BEFORE;
  }
});

describe('scratchDatabaseName', () => {
  it('names the database under the prefix the run gave itself', () => {
    process.env.VALENCE_SCRATCH_PREFIX = 'valence_test_run1_';

    expect(scratchDatabaseName()).toMatch(/^valence_test_run1_[0-9a-f]{12}$/);
  });

  it('falls back to a plain prefix for a test run on its own, and never repeats a name', () => {
    delete process.env.VALENCE_SCRATCH_PREFIX;

    expect(scratchDatabaseName()).toMatch(/^valence_test_[0-9a-f]{12}$/);
    expect(scratchDatabaseName()).not.toBe(scratchDatabaseName());
  });
});
