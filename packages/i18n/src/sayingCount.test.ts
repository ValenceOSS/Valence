import { describe, expect, it } from 'vitest';
import { sayingCount } from './sayingCount';

describe('sayingCount', () => {
  it('codes the words without their form, and keeps the count to pick one by', () => {
    expect(sayingCount('common.count.episodes', 2)).toEqual({
      code: 'common.count.episodes',
      message: '2 episodes',
      values: { count: 2 },
    });
  });
});
