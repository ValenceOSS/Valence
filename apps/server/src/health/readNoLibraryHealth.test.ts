import { describe, expect, it } from 'vitest';
import { readNoLibraryHealth } from './readNoLibraryHealth';

describe('readNoLibraryHealth', () => {
  it('finds nothing wrong', async () => {
    const health = await readNoLibraryHealth();

    expect(health.unmatched.total + health.duplicate.total).toBe(0);
  });
});
