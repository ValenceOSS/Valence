import { describe, expect, it } from 'vitest';
import { describeTitleValue } from './describeTitleValue';

describe('describeTitleValue', () => {
  it('writes each kind of value out in a line', () => {
    expect(describeTitleValue('A film')).toBe('A film');
    expect(describeTitleValue(7.1)).toBe('7.1');
    expect(describeTitleValue(['Drama', 'Heist'])).toBe('Drama, Heist');
    expect(describeTitleValue({ GB: '15', US: 'R' })).toBe('GB 15, US R');
  });

  it('says plainly when there is nothing', () => {
    expect(describeTitleValue(null)).toBe('Nothing');
    expect(describeTitleValue([])).toBe('Nothing');
  });
});
