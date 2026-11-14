import { describe, expect, it } from 'vitest';
import { toCuePlacement } from './toCuePlacement';

describe('where on the picture a placed line goes', () => {
  it('puts a line at the point the script named', () => {
    expect(toCuePlacement({ x: 0.75, y: 0.2 }, 7)).toMatchObject({ left: '75%', top: '20%' });
  });

  it('hangs a line from the corner its alignment names, not from its top left', () => {
    expect(toCuePlacement({ x: 0.5, y: 0.5 }, 7).transform).toBe('translate(0, 0)');
    expect(toCuePlacement({ x: 0.5, y: 0.5 }, 3).transform).toBe('translate(-100%, -100%)');
    expect(toCuePlacement({ x: 0.5, y: 0.5 }, 5).transform).toBe('translate(-50%, -50%)');
    expect(toCuePlacement({ x: 0.5, y: 0.5 }, 8).transform).toBe('translate(-50%, 0)');
  });

  it('makes the box as wide as its words, rather than the room left beside the point', () => {
    const nearTheRight = toCuePlacement({ x: 1700 / 1920, y: 0.5 }, 8);

    expect(nearTheRight).toMatchObject({ width: 'max-content', maxWidth: '90%' });
    expect(nearTheRight).not.toHaveProperty('right');
  });

  it('survives an alignment outside the nine, rather than placing a line nowhere', () => {
    expect(toCuePlacement({ x: 0, y: 0 }, 42).transform).toBe('translate(-100%, 0)');
    expect(toCuePlacement({ x: 0, y: 0 }, 0).transform).toBe('translate(0, -100%)');
  });
});
