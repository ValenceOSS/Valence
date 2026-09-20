import { describe, expect, it } from 'vitest';
import { lightsOfAFrame } from './lightsOfAFrame';

const frame = (colours: [number, number, number][]): Uint8ClampedArray => {
  const pixels = new Uint8ClampedArray(colours.length * 4);

  colours.forEach(([red, green, blue], at) => {
    pixels.set([red, green, blue, 255], at * 4);
  });

  return pixels;
};

describe('lightsOfAFrame', () => {
  it('gives a colour for each quarter, top left first', () => {
    const lights = lightsOfAFrame(
      frame([
        [255, 0, 0],
        [0, 255, 0],
        [0, 0, 255],
        [255, 255, 255],
      ]),
      2,
      2,
    );

    expect(lights).toHaveLength(4);
    expect(lights[0]).toMatch(/^rgb\(255 /);
    expect(lights[1]).toMatch(/^rgb\(\d+ 255 /);
    expect(lights[2]).toMatch(/ 255\)$/);
    expect(lights[3]).toBe('rgb(255 255 255)');
  });

  it('never lets a quarter go dark, so there is always a glow', () => {
    const [light] = lightsOfAFrame(frame([[0, 0, 0]]), 1, 1);

    expect(light).toBe('rgb(40 40 40)');
  });

  it('pushes a dull colour further from grey', () => {
    const [light] = lightsOfAFrame(frame([[120, 100, 100]]), 1, 1);
    const red = Number(/rgb\((\d+)/.exec(light ?? '')?.[1]);

    expect(red).toBeGreaterThan(120);
  });

  it('averages the pixels in a quarter', () => {
    const [light] = lightsOfAFrame(
      frame([
        [200, 200, 200],
        [100, 100, 100],
        [150, 150, 150],
        [150, 150, 150],
      ]),
      4,
      1,
    );

    expect(light).toBe('rgb(150 150 150)');
  });
});
