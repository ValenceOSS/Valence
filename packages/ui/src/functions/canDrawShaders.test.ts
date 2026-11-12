import { describe, expect, it, vi } from 'vitest';
import { canDrawShaders } from './canDrawShaders';

describe('canDrawShaders', () => {
  it('declines where the browser gives no WebGL 2', () => {
    expect(canDrawShaders(() => null)).toBe(false);
  });

  it('agrees where it does, and lets the context go', () => {
    const loseContext = vi.fn();

    expect(canDrawShaders(() => ({ getExtension: () => ({ loseContext }) }))).toBe(true);
    expect(loseContext).toHaveBeenCalled();
  });
});
