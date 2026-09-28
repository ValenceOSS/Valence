import { describe, expect, it } from 'vitest';
import { RefusalSchema } from './Refusal';

describe('RefusalSchema', () => {
  it('reads why the server refused', () => {
    expect(RefusalSchema.parse({ error: 'That picture is too large.' }).error).toBe(
      'That picture is too large.',
    );
  });

  it('refuses an answer that gives no reason', () => {
    expect(RefusalSchema.safeParse({ message: 'no' }).success).toBe(false);
  });
});
