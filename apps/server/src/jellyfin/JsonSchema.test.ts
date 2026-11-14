import { describe, expect, it } from 'vitest';
import { JsonSchema } from './JsonSchema';

describe('JsonSchema', () => {
  it('takes any JSON', () => {
    expect(JsonSchema.safeParse({ a: [1, 'b', null, true, { c: {} }] }).success).toBe(true);
  });

  it('refuses what JSON cannot hold', () => {
    expect(JsonSchema.safeParse(undefined).success).toBe(false);
  });
});
