import { describe, expect, it } from 'vitest';
import { rubberBand } from './rubberBand';

describe('rubberBand', () => {
  it('leaves a width inside the limits alone', () => {
    expect(rubberBand(300, 200, 400)).toBe(300);
  });

  it('gives a little past the widest, and less the further it is pulled', () => {
    const near = rubberBand(450, 200, 400) - 400;
    const far = rubberBand(600, 200, 400) - 400;

    expect(near).toBeGreaterThan(0);
    expect(near).toBeLessThan(50);
    expect(far / 200).toBeLessThan(near / 50);
  });

  it('gives a little past the narrowest', () => {
    const given = 200 - rubberBand(100, 200, 400);

    expect(given).toBeGreaterThan(0);
    expect(given).toBeLessThan(100);
  });
});
