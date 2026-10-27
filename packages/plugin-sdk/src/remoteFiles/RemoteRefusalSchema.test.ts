import { describe, expect, it } from 'vitest';
import { RemoteRefusalSchema } from './RemoteRefusalSchema';

describe('RemoteRefusalSchema', () => {
  it('reads a reason, with no message where none was given', () => {
    expect(RemoteRefusalSchema.parse({ reason: 'limitReached' })).toEqual({
      reason: 'limitReached',
      message: null,
    });
  });

  it('refuses a reason Valence cannot say anything about', () => {
    expect(RemoteRefusalSchema.safeParse({ reason: 'cosmicRays' }).success).toBe(false);
  });
});
