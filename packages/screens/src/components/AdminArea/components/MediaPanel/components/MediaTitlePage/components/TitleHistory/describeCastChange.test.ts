import { describe, expect, it } from 'vitest';
import { describeCastChange } from './describeCastChange';

const member = (personId: number, name: string, role = '') => ({
  personId,
  name,
  role,
  imageUrl: null,
});

describe('describeCastChange', () => {
  it('says who was added and taken off, whose part changed, and that the order did', () => {
    const one = member(1, 'One');
    const two = member(2, 'Two');

    expect(
      describeCastChange([one, two], [two, member(1, 'One', 'Lead'), member(3, 'Three')]),
    ).toBe('added Three; changed the part of One; changed the order');
    expect(describeCastChange([one, two], [one])).toBe('took off Two');
  });

  it('says nothing where nothing changed, or neither is a cast', () => {
    expect(describeCastChange([member(1, 'One')], [member(1, 'One')])).toBeNull();
    expect(describeCastChange('a', 'b')).toBeNull();
  });
});
