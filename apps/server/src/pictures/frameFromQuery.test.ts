import { describe, expect, it } from 'vitest';
import { frameFromQuery } from './frameFromQuery';

describe('frameFromQuery', () => {
  it('reads where the picture sits', () => {
    expect(frameFromQuery({ zoom: '1.5', x: '-0.25', y: '1' })).toEqual({
      zoom: 1.5,
      x: -0.25,
      y: 1,
    });
    expect(frameFromQuery({ x: '0.5' })).toEqual({ zoom: 1, x: 0.5, y: 0 });
  });

  it('leaves a picture in its middle where nothing, or nothing sensible, is said', () => {
    expect(frameFromQuery({})).toBeNull();
    expect(frameFromQuery({ zoom: '12' })).toBeNull();
    expect(frameFromQuery({ x: 'left' })).toBeNull();
  });
});
