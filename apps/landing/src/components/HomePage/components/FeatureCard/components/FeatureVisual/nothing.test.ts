import { describe, expect, it } from 'vitest';
import { nothing } from './nothing';

describe('nothing', () => {
  it('does nothing and answers with nothing', () => {
    expect(nothing()).toBeUndefined();
  });
});
