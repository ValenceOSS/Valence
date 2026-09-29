import { describe, expect, it } from 'vitest';
import { LocalIdSchema } from './LocalIdSchema';

describe('LocalIdSchema', () => {
  it('accepts a short kebab-case id and refuses anything else', () => {
    expect(LocalIdSchema.safeParse('sync-lists').success).toBe(true);
    expect(LocalIdSchema.safeParse('Sync').success).toBe(false);
    expect(LocalIdSchema.safeParse('9lives').success).toBe(false);
    expect(LocalIdSchema.safeParse(`a${'b'.repeat(40)}`).success).toBe(false);
  });
});
