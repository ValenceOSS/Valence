import { describe, expect, it } from 'vitest';
import { inkFor } from './inkFor';

describe('inkFor', () => {
  it('writes dark on a light colour', () => {
    expect(inkFor('#ffffff')).toBe('dark');
    expect(inkFor('#f2c230')).toBe('dark');
  });

  it('writes light on a dark colour', () => {
    expect(inkFor('#000000')).toBe('light');
    expect(inkFor('#2f5fb8')).toBe('light');
  });

  it('judges by how bright a colour looks, so a yellow and a blue of one value part ways', () => {
    expect(inkFor('#ffff00')).toBe('dark');
    expect(inkFor('#0000ff')).toBe('light');
  });

  it('reads a colour it cannot parse as dark, and writes light on it', () => {
    expect(inkFor('not a colour')).toBe('light');
  });
});
