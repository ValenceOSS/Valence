import { describe, expect, it } from 'vitest';
import { formatMoney } from './formatMoney';

describe('formatMoney', () => {
  it('shortens millions and billions', () => {
    expect(formatMoney(165_000_000)).toBe('$165M');
    expect(formatMoney(1_200_000_000)).toBe('$1.2B');
  });

  it('keeps one decimal where it helps', () => {
    expect(formatMoney(47_500_000)).toBe('$47.5M');
  });

  it('says a small amount in full', () => {
    expect(formatMoney(500)).toBe('$500');
  });

  it('says a round amount without a decimal, which the phone used to add', () => {
    expect(formatMoney(40_000_000)).toBe('$40M');
    expect(formatMoney(118_133_252)).toBe('$118.1M');
  });

  it('shortens thousands as well', () => {
    expect(formatMoney(950_000)).toBe('$950K');
  });

  it('keeps the sign of a loss', () => {
    expect(formatMoney(-2_500_000)).toBe('-$2.5M');
  });
});
