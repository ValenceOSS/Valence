import { describe, expect, it } from 'vitest';
import { translateRegex } from './translateRegex';

describe('translateRegex', () => {
  it('turns an inline case-insensitive marker into the flag', () => {
    const expression = translateRegex('(?i)\\bS0*(\\d+)\\b');

    expect(expression.flags).toBe('i');
    expect(expression.exec('season s02')?.[1]).toBe('2');
  });

  it('replaces every match when asked to', () => {
    expect('a-b-c'.replace(translateRegex('-', true), '+')).toBe('a+b+c');
  });

  it('turns a named Unicode block into its range, inside and outside a class', () => {
    expect(translateRegex('[\\p{IsCyrillic}\\W]+').test('Привет')).toBe(true);
    expect(translateRegex('^\\p{IsCyrillic}+$').test('Мир')).toBe(true);
    expect(translateRegex('^\\p{IsCyrillic}+$').test('World')).toBe(false);
  });

  it('keeps an escape it has no translation for', () => {
    expect(translateRegex('\\d+\\.\\d').test('3.5')).toBe(true);
    expect(translateRegex('[\\]]').test(']')).toBe(true);
  });

  it('leaves a block it does not know as it was', () => {
    expect(() => translateRegex('\\p{IsKlingon}')).not.toThrow();
  });

  it('throws on a pattern JavaScript cannot run', () => {
    expect(() => translateRegex('((?>[^()]+|(?<o>)\\(|(?<-o>)\\))*(?(o)(?!)))')).toThrow();
  });
});
