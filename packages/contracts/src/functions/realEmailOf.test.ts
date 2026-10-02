import { describe, expect, it } from 'vitest';
import { realEmailOf } from './realEmailOf';

describe('realEmailOf', () => {
  it('keeps a real address', () => {
    expect(realEmailOf('ada@example.com')).toBe('ada@example.com');
  });

  it('hides the placeholder, whatever its case', () => {
    expect(realEmailOf('abc@No-Email.Invalid')).toBeNull();
  });
});
