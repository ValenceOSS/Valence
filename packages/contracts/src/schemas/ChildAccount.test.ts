import { describe, expect, it } from 'vitest';
import { CHILD_PIN, ChildAccountListSchema } from './ChildAccount';

describe('ChildAccount', () => {
  it('reads the children an account looks after', () => {
    expect(
      ChildAccountListSchema.parse({ children: [{ id: 'kit', name: 'Kit', hasPin: false }] }),
    ).toEqual({ children: [{ id: 'kit', name: 'Kit', hasPin: false }] });
  });

  it('takes a PIN of four to eight digits and nothing else', () => {
    expect(CHILD_PIN.test('1234')).toBe(true);
    expect(CHILD_PIN.test('12345678')).toBe(true);
    expect(CHILD_PIN.test('123')).toBe(false);
    expect(CHILD_PIN.test('123456789')).toBe(false);
    expect(CHILD_PIN.test('12a4')).toBe(false);
  });
});
