import { describe, expect, it } from 'vitest';
import { dominantColours } from './dominantColours';

const pictureOf = (...colours: [number, number, number, number][]): number[] =>
  colours.flatMap(([red, green, blue, times]) =>
    Array.from({ length: times }, () => [red, green, blue, 255]).flat(),
  );

const hueOf = (hex: string): 'red' | 'green' | 'blue' => {
  const red = parseInt(hex.slice(1, 3), 16);
  const green = parseInt(hex.slice(3, 5), 16);
  const blue = parseInt(hex.slice(5, 7), 16);

  return red >= green && red >= blue ? 'red' : green >= blue ? 'green' : 'blue';
};

describe('dominantColours', () => {
  it('puts the colour most of the picture is made of first', () => {
    const colours = dominantColours(pictureOf([200, 120, 30, 30], [40, 90, 200, 10]));

    expect(colours).toHaveLength(3);
    expect(hueOf(colours[0] ?? '')).toBe('red');
    expect(hueOf(colours[1] ?? '')).toBe('blue');
  });

  it('passes over black, white and grey', () => {
    const colours = dominantColours(
      pictureOf([0, 0, 0, 500], [255, 255, 255, 500], [128, 128, 128, 500], [30, 160, 60, 5]),
    );

    expect(hueOf(colours[0] ?? '')).toBe('green');
  });

  it('lifts a dim colour so it reads as light', () => {
    const [colour = ''] = dominantColours(pictureOf([60, 20, 10, 10]), 1);
    const brightest = Math.max(
      parseInt(colour.slice(1, 3), 16),
      parseInt(colour.slice(3, 5), 16),
      parseInt(colour.slice(5, 7), 16),
    );

    expect(brightest).toBeGreaterThan(180);
  });

  it('repeats what it found when the picture has fewer colours than asked for', () => {
    const colours = dominantColours(pictureOf([200, 40, 40, 10]), 3);

    expect(colours[1]).toBe(colours[0]);
    expect(colours[2]).toBe(colours[0]);
  });

  it("falls back to Valence's blues for a picture with no colour in it", () => {
    const colours = dominantColours(pictureOf([0, 0, 0, 10]), 2);

    expect(colours.map(hueOf)).toEqual(['blue', 'blue']);
  });
});
