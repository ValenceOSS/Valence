import { describe, expect, it } from 'vitest';
import { lyricStanding } from './lyricStanding';

describe('lyricStanding', () => {
  it('brings the line being sung up to full size and brightness', () => {
    expect(lyricStanding(3, 3, true, true)).toEqual({ opacity: 1, scale: 1, blur: 0 });
  });

  it('dims sung lines more than those to come', () => {
    expect(lyricStanding(1, 3, true, false).opacity).toBeLessThan(
      lyricStanding(5, 3, true, false).opacity,
    );
  });

  it('blurs lines further from the one sung only when immersive', () => {
    expect(lyricStanding(5, 3, true, false).blur).toBe(0);
    expect(lyricStanding(5, 3, true, true).blur).toBeGreaterThan(
      lyricStanding(4, 3, true, true).blur,
    );
    expect(lyricStanding(30, 3, true, true).blur).toBe(6);
  });

  it('keeps the first line in focus before any is sung', () => {
    expect(lyricStanding(0, -1, true, true)).toEqual({ opacity: 0.6, scale: 0.96, blur: 0 });
    expect(lyricStanding(2, -1, true, true).blur).toBeGreaterThan(0);
  });

  it('leaves untimed words evenly lit', () => {
    expect(lyricStanding(1, -1, false, true)).toEqual({ opacity: 0.9, scale: 1, blur: 0 });
  });
});
