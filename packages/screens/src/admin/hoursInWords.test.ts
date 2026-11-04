import { describe, expect, it } from 'vitest';
import { hoursInWords } from './hoursInWords';

describe('hoursInWords', () => {
  it('says minutes under an hour', () => {
    expect(hoursInWords(0.8)).toBe('48 min');
  });

  it('says whole hours alone', () => {
    expect(hoursInWords(12)).toBe('12 h');
  });

  it('says hours and the minutes over', () => {
    expect(hoursInWords(1 + 20 / 60)).toBe('1 h 20 min');
  });
});
