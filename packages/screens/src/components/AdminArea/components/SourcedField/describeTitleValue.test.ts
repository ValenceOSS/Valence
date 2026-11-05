import { describe, expect, it } from 'vitest';
import { describeTitleValue } from './describeTitleValue';

describe('describeTitleValue', () => {
  it('writes each kind of value out in a line', () => {
    expect(describeTitleValue('A film')).toBe('A film');
    expect(describeTitleValue(7.1)).toBe('7.1');
    expect(describeTitleValue(['Drama', 'Heist'])).toBe('Drama, Heist');
    expect(describeTitleValue({ GB: '15', US: 'R' })).toBe('GB 15, US R');
  });

  it('names a cast, and only the first few of a long one', () => {
    const member = (name: string) => ({ personId: null, name, role: '', imageUrl: null });

    expect(describeTitleValue([member('One'), member('Two')])).toBe('One, Two');
    expect(describeTitleValue(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(member))).toBe(
      'A, B, C, D, E, F and 2 others',
    );
  });

  it('says plainly when there is nothing', () => {
    expect(describeTitleValue(null)).toBe('Nothing');
    expect(describeTitleValue([])).toBe('Nothing');
  });
});
