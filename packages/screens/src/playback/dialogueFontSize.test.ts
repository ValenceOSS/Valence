import { describe, expect, it } from 'vitest';
import { dialogueFontSize } from './dialogueFontSize';

describe('dialogueFontSize', () => {
  it('sizes dialogue by the picture, never below the page text, scaled as the viewer chose', () => {
    expect(dialogueFontSize(100)).toBe('calc(1 * max(1rem, 4.5cqh))');
    expect(dialogueFontSize(150)).toBe('calc(1.5 * max(1rem, 4.5cqh))');
  });
});
