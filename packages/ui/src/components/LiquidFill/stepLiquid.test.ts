import { describe, expect, it } from 'vitest';
import type { LiquidState } from './LiquidFill.types';
import { stepLiquid } from './stepLiquid';

const still = (level: number): LiquidState => ({
  level,
  levelSpeed: 0,
  heights: [0, 0, 0, 0, 0],
  speeds: [0, 0, 0, 0, 0],
  back: [0, 0, 0, 0, 0],
  backSpeeds: [0, 0, 0, 0, 0],
  seconds: 0,
  phases: [0, 0, 0, 0, 0, 0],
  swell: [0, 0, 0, 0, 0],
  backSwell: [0, 0, 0, 0, 0],
});

const never = () => 0.99;

describe('stepLiquid', () => {
  it('moves the level towards where it is meant to be', () => {
    const state = still(0);

    for (let frame = 0; frame < 30; frame += 1) {
      stepLiquid(state, 0.5, 40, never);
    }

    expect(state.level).toBeGreaterThan(0.1);
  });

  it('overshoots and settles, as poured liquid does', () => {
    const state = still(0);
    let highest = 0;

    for (let frame = 0; frame < 600; frame += 1) {
      stepLiquid(state, 0.5, 40, never);
      highest = Math.max(highest, state.level);
    }

    expect(highest).toBeGreaterThan(0.5);
    expect(state.level).toBeCloseTo(0.5, 2);
  });

  it('spreads a nudge to the points beside it, as a ripple', () => {
    const state = still(0.5);

    state.speeds[2] = 4;
    stepLiquid(state, 0.5, 40, never);
    stepLiquid(state, 0.5, 40, never);

    expect(state.heights[1]).not.toBe(0);
    expect(state.heights[3]).not.toBe(0);
  });

  it('lets a ripple die away', () => {
    const state = still(0.5);

    state.heights[2] = 4;

    for (let frame = 0; frame < 2000; frame += 1) {
      stepLiquid(state, 0.5, 40, never);
    }

    expect(Math.max(...state.heights.map(Math.abs))).toBeLessThan(0.05);
  });

  it('nudges the surface now and then at random', () => {
    const state = still(0.5);
    const chances = [0, 0.5, 0.9, 0.99];
    let asked = 0;

    stepLiquid(state, 0.5, 40, () => chances[asked++] ?? 0.99);

    expect(state.heights.some((height) => height !== 0)).toBe(true);
  });

  it('swells the surface with waves that change over time', () => {
    const state = still(0.5);

    stepLiquid(state, 0.5, 40, never);
    const first = [...state.swell];

    stepLiquid(state, 0.5, 40, never);

    expect(state.swell).not.toEqual(first);
    expect(state.swell.some((rise) => rise !== 0)).toBe(true);
  });
});
