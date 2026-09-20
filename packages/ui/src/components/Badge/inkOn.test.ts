import { describe, expect, it } from 'vitest';
import { inkOn } from './inkOn';

describe('inkOn', () => {
  it('sets white on a dark colour', () => {
    expect(inkOn('#206694')).toBe('#ffffff');
  });

  it('sets near-black on a light colour', () => {
    expect(inkOn('#F1C40F')).toBe('#111111');
  });

  it('tells a bright yellow from an equally saturated blue, which arithmetic would not', () => {
    expect(inkOn('#FFFF00')).toBe('#111111');
    expect(inkOn('#0000FF')).toBe('#ffffff');
  });

  it('reads a colour with or without its hash', () => {
    expect(inkOn('99AAB5')).toBe(inkOn('#99AAB5'));
  });

  it('falls back to white for something that is not a colour', () => {
    expect(inkOn('not a colour')).toBe('#ffffff');
  });
});
