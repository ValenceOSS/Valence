import { describe, expect, it } from 'vitest';
import { blackEnough, findCreditsInFrames, findTheCut } from './findCreditsInFrames';
import type { KeyframeLook } from './findCreditsInFrames';

const scene = (seconds: number, blackPercent = 20): KeyframeLook => ({
  seconds,
  blackPercent,
  yMin: 16,
  yLow: 24,
  yHigh: 120,
  yMax: 230,
  saturation: 9,
});

const lettering = (seconds: number): KeyframeLook => ({
  seconds,
  blackPercent: 98,
  yMin: 16,
  yLow: 16,
  yHigh: 16,
  yMax: 245,
  saturation: 0.3,
});

const fade = (seconds: number): KeyframeLook => ({ ...lettering(seconds), yMax: 30 });

/**
 * Keyframes every ten seconds over a stretch, each drawn by the function given.
 *
 * @param from - The first keyframe.
 * @param to - Where they stop.
 * @param draw - How each looks.
 * @returns The keyframes.
 */
const every = (from: number, to: number, draw: (seconds: number) => KeyframeLook) =>
  Array.from({ length: Math.floor((to - from) / 10) }, (_, index) => draw(from + index * 10));

describe('findCreditsInFrames', () => {
  it('finds lettering on black that runs to the end', () => {
    const found = findCreditsInFrames(
      [...every(1700, 2110, scene), ...every(2110, 2190, lettering)],
      2195,
    );

    expect(found).toEqual({
      startSeconds: 2110,
      endSeconds: 2195,
      blackAt: 2110,
      storyBefore: 2100,
    });
  });

  it('takes the last roll, so a scene after the credits still plays', () => {
    const found = findCreditsInFrames(
      [...every(1700, 2000, scene), ...every(2000, 2100, lettering), ...every(2100, 2195, scene)],
      2195,
    );

    expect(found).toMatchObject({ startSeconds: 2000, endSeconds: 2100 });
  });

  it('never calls a fade to black between scenes credits', () => {
    expect(
      findCreditsInFrames(
        [...every(1700, 2000, scene), fade(2000), ...every(2010, 2195, scene)],
        2195,
      ),
    ).toBeNull();
  });

  it('never calls a long stretch of black with nothing written on it credits', () => {
    expect(
      findCreditsInFrames([...every(1700, 2100, scene), ...every(2100, 2195, fade)], 2195),
    ).toBeNull();
  });

  it('never calls lettering too short to be credits credits', () => {
    expect(
      findCreditsInFrames(
        [...every(1700, 2100, scene), lettering(2100), ...every(2110, 2195, scene)],
        2195,
      ),
    ).toBeNull();
  });

  it('keeps a roll whole across a frame or two of picture inside it', () => {
    const found = findCreditsInFrames(
      [
        ...every(1700, 2000, scene),
        ...every(2000, 2060, lettering),
        scene(2060),
        ...every(2070, 2190, lettering),
      ],
      2195,
    );

    expect(found).toMatchObject({ startSeconds: 2000, endSeconds: 2195 });
  });

  it('keeps a still roll whole however far apart its keyframes are', () => {
    const found = findCreditsInFrames(
      [
        ...every(1700, 2290, scene),
        lettering(2291),
        lettering(2301),
        lettering(2322),
        lettering(2343),
      ],
      2362,
    );

    expect(found).toMatchObject({ startSeconds: 2291, endSeconds: 2362 });
  });

  it('counts a page too full of names to clear the bar for black, as a roll does', () => {
    const full = (seconds: number): KeyframeLook => ({ ...lettering(seconds), blackPercent: 84 });
    const found = findCreditsInFrames(
      [...every(1700, 2100, scene), lettering(2100), full(2110), lettering(2120), full(2130)],
      2140,
    );

    expect(found).toMatchObject({ startSeconds: 2100, endSeconds: 2140 });
  });

  it('never counts a dark, colourful scene as a page of credits', () => {
    const night = (seconds: number): KeyframeLook => ({
      ...lettering(seconds),
      blackPercent: 70,
      saturation: 16,
    });

    expect(
      findCreditsInFrames([...every(1700, 2100, scene), ...every(2100, 2140, night)], 2140),
    ).toBeNull();
  });

  it('finds nothing in a film with no keyframes read', () => {
    expect(findCreditsInFrames([], 2195)).toBeNull();
  });
});

describe('blackEnough', () => {
  it('asks for most of a frame to be black', () => {
    expect(blackEnough(every(0, 500, scene).map((look) => ({ ...look, blackPercent: 0 })))).toBe(
      85,
    );
  });

  it('raises the bar over a film letterboxed throughout', () => {
    expect(blackEnough(every(0, 500, (seconds) => scene(seconds, 25)))).toBeCloseTo(88.75);
  });
});

describe('findTheCut', () => {
  it('finds the first black frame between two keyframes', () => {
    expect(findTheCut([scene(2100), scene(2101), lettering(2102.5), lettering(2103)], 85)).toBe(
      2102.5,
    );
  });

  it('finds nothing where none of them is black', () => {
    expect(findTheCut([scene(2100), scene(2101)], 85)).toBeNull();
  });
});
