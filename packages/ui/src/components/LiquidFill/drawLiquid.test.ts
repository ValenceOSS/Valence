import { describe, expect, it, vi } from 'vitest';
import type { LiquidState } from './LiquidFill.types';
import { drawLiquid } from './drawLiquid';

const state = (level: number): LiquidState => ({
  level,
  levelSpeed: 0,
  heights: [0, 1, 0],
  speeds: [0, 0, 0],
  back: [0, 0, 0],
  backSpeeds: [0, 0, 0],
  seconds: 0,
  phases: [0, 0, 0, 0, 0, 0],
  swell: [0, 0, 0],
  backSwell: [0, 0, 0],
});

/**
 * A stand-in canvas context that records what was drawn.
 */
const recorder = () => ({
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  closePath: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  fillStyle: '',
  strokeStyle: '',
  globalAlpha: 1,
  lineWidth: 1,
});

describe('drawLiquid', () => {
  it('draws a body behind, a body in front and a line along the surface', () => {
    const context = recorder();

    drawLiquid(context, state(0.5), 'green', 40, 40);

    expect(context.fill).toHaveBeenCalledTimes(2);
    expect(context.stroke).toHaveBeenCalledTimes(1);
    expect(context.fillStyle).toBe('green');
  });

  it('draws nothing once the liquid has drained', () => {
    const context = recorder();

    drawLiquid(context, state(0), 'green', 40, 40);

    expect(context.clearRect).toHaveBeenCalled();
    expect(context.fill).not.toHaveBeenCalled();
  });

  it('puts the surface as far up the canvas as the liquid is full', () => {
    const context = recorder();

    drawLiquid(context, state(0.25), 'green', 40, 40);

    expect(context.lineTo).toHaveBeenCalledWith(0, 30);
  });
});
