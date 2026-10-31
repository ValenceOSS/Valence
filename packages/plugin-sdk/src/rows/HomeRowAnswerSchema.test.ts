import { describe, expect, it } from 'vitest';
import { HomeRowAnswerSchema } from './HomeRowAnswerSchema';

describe('HomeRowAnswerSchema', () => {
  it('takes up to forty ids and nothing else', () => {
    expect(HomeRowAnswerSchema.safeParse({ items: ['a', 'b'] }).success).toBe(true);
    expect(
      HomeRowAnswerSchema.safeParse({ items: Array.from({ length: 41 }, (_, at) => String(at)) })
        .success,
    ).toBe(false);
    expect(HomeRowAnswerSchema.safeParse({ items: [], title: 'Sneaky' }).success).toBe(false);
  });
});
