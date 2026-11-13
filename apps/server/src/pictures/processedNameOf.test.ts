import { describe, expect, it } from 'vitest';
import { processedNameOf } from './processedNameOf';

describe('processedNameOf', () => {
  it('names the processed picture after the original, as WebP', () => {
    expect(processedNameOf('a1b2.png')).toBe('a1b2.webp');
    expect(processedNameOf('household-u1.jpeg')).toBe('household-u1.webp');
  });

  it('keeps a WebP original’s name', () => {
    expect(processedNameOf('a1b2.webp')).toBe('a1b2.webp');
  });
});
