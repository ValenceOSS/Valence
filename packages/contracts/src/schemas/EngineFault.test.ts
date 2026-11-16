import { describe, expect, it } from 'vitest';
import { EngineFaultSchema } from './EngineFault';

describe('EngineFaultSchema', () => {
  it('takes where the engine failed and what it said', () => {
    expect(
      EngineFaultSchema.safeParse({ stage: 'opening', detail: 'Failed to fetch' }).success,
    ).toBe(true);
    expect(EngineFaultSchema.safeParse({ stage: 'refused', detail: null }).success).toBe(true);
  });

  it('refuses a stage it does not know', () => {
    expect(EngineFaultSchema.safeParse({ stage: 'flying', detail: null }).success).toBe(false);
  });

  it('refuses a detail longer than a log line should carry', () => {
    expect(
      EngineFaultSchema.safeParse({ stage: 'decoding', detail: 'x'.repeat(301) }).success,
    ).toBe(false);
  });
});
