import { describe, expect, it } from 'vitest';
import { textOfValue } from './textOfValue';

describe('textOfValue', () => {
  it('writes words and numbers out, and nothing for anything else', () => {
    expect(textOfValue('Arrival')).toBe('Arrival');
    expect(textOfValue(7.5)).toBe('7.5');
    expect(textOfValue(null)).toBe('');
    expect(textOfValue(['Drama'])).toBe('');
  });
});
