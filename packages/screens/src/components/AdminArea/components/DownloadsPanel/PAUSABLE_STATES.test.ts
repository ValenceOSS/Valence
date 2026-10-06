import { describe, expect, it } from 'vitest';
import { PAUSABLE_STATES } from './PAUSABLE_STATES';

describe('PAUSABLE_STATES', () => {
  it('pauses what is still to finish, and nothing finished, failed or paused already', () => {
    expect([...PAUSABLE_STATES].sort()).toEqual(['downloading', 'metadata', 'queued', 'stalled']);
  });
});
