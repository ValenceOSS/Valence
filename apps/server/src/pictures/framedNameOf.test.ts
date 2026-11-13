import { describe, expect, it } from 'vitest';
import { framedNameOf } from './framedNameOf';

describe('framedNameOf', () => {
  it('names the framed picture after the original, marked as framed, as WebP', () => {
    expect(framedNameOf('a1b2.png')).toBe('a1b2.framed.webp');
    expect(framedNameOf('household-u1.jpg')).toBe('household-u1.framed.webp');
  });
});
