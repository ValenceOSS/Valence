import { describe, expect, it } from 'vitest';
import { describeLength } from '@ValenceClient/books/describeLength';

describe('describeLength', () => {
  it('says minutes alone for less than an hour, never less than one', () => {
    expect(describeLength(540)).toBe('9 min');
    expect(describeLength(5)).toBe('1 min');
  });

  it('says hours and minutes, dropping the minutes on the hour', () => {
    expect(describeLength(7500)).toBe('2 h 5 min');
    expect(describeLength(7200)).toBe('2 h');
  });
});
