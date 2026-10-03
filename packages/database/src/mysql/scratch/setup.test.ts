import { afterEach, describe, expect, it } from 'vitest';
import { setup } from './setup';

const BEFORE = { ...process.env };

afterEach(() => {
  process.env = { ...BEFORE };
});

describe('setup', () => {
  it('gives the run a prefix of its own for its scratch databases', () => {
    setup();
    const first = process.env.VALENCE_SCRATCH_PREFIX;

    setup();

    expect(first).toMatch(/^valence_test_[0-9a-f]{8}_$/);
    expect(process.env.VALENCE_SCRATCH_PREFIX).not.toBe(first);
  });

  it('has nothing to clear where no engine was named', async () => {
    delete process.env.MYSQL_TEST_URL;

    await expect(setup()()).resolves.toBeUndefined();
  });
});
