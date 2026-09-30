import { describe, expect, it } from 'vitest';
import { AMBIENT_GRID } from './AMBIENT_GRID';

describe('AMBIENT_GRID', () => {
  it('lays a grid over the picture fine enough to light the room around it', () => {
    expect(AMBIENT_GRID.columns).toBeGreaterThan(AMBIENT_GRID.rows);
    expect(AMBIENT_GRID.columns * AMBIENT_GRID.rows).toBe(140);
  });

  it('blends each cell with its neighbours', () => {
    expect(AMBIENT_GRID.reach).toBeGreaterThan(0);
  });
});
