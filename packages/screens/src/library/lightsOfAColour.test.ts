import { describe, expect, it } from 'vitest';
import { lightsOfAColour } from './lightsOfAColour';

describe('lightsOfAColour', () => {
  it('spreads one colour across the page, with lighter and deeper shades of it', () => {
    const lights = lightsOfAColour('#d94b8f');

    expect(lights.length).toBeGreaterThan(3);
    expect(lights[0]).toEqual({ color: 'rgb(217, 75, 143)', at: '8% 10%', weight: 1 });
    expect(new Set(lights.map((light) => light.at)).size).toBe(lights.length);
    expect(new Set(lights.map((light) => light.color)).size).toBeGreaterThan(2);
  });

  it('gives no lights for something that is not a colour it can read', () => {
    expect(lightsOfAColour('pink')).toEqual([]);
  });
});
