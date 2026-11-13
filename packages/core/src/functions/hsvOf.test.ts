import { describe, expect, it } from 'vitest';
import { hexOfHsv } from './hexOfHsv';
import { hsvOf } from './hsvOf';

describe('hsvOf', () => {
  it('reads a colour as its hue, saturation and brightness', () => {
    expect(hsvOf('#ff0000')).toEqual({ hue: 0, saturation: 1, brightness: 1 });
    expect(hsvOf('#000000')).toMatchObject({ saturation: 0, brightness: 0 });
  });

  it('starts on a full red where it is given no colour', () => {
    expect(hsvOf('')).toEqual({ hue: 0, saturation: 1, brightness: 1 });
  });

  it('reads back the colour it was written from', () => {
    const { hue, saturation, brightness } = hsvOf('#3a8ee8');

    expect(hexOfHsv(hue, saturation, brightness)).toBe('#3a8ee8');
  });
});
