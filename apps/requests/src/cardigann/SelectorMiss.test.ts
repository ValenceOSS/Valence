import { describe, expect, it } from 'vitest';
import { SelectorMiss } from './SelectorMiss';

describe('SelectorMiss', () => {
  it('says what did not match', () => {
    const miss = new SelectorMiss('a.title');

    expect(miss.message).toBe('Nothing matched a.title');
    expect(miss.name).toBe('SelectorMiss');
  });
});
