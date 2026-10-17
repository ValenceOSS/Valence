import { describe, expect, it, vi } from 'vitest';
import { drawStroke } from './drawStroke';

const SQUARE_ENDS: CanvasLineCap = 'butt';

const aPen = () => ({
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  stroke: vi.fn(),
  globalAlpha: 1,
  strokeStyle: '',
  lineWidth: 1,
  lineCap: SQUARE_ENDS,
});

describe('drawStroke', () => {
  it('bows the line by twice the bend, so its middle sits that far out', () => {
    const pen = aPen();

    drawStroke(pen, 40, 120, 'grey', { bend: 5, length: 90, thickness: 4, opacity: 1 });

    expect(pen.moveTo).toHaveBeenCalledWith(20, 15);
    expect(pen.quadraticCurveTo).toHaveBeenCalledWith(30, 60, 20, 105);
    expect(pen.lineWidth).toBe(4);
    expect(pen.lineCap).toBe('round');
    expect(pen.stroke).toHaveBeenCalledOnce();
  });

  it('only clears the canvas once the line has faded out', () => {
    const pen = aPen();

    drawStroke(pen, 40, 120, 'grey', { bend: 0, length: 110, thickness: 2, opacity: 0 });

    expect(pen.clearRect).toHaveBeenCalledOnce();
    expect(pen.stroke).not.toHaveBeenCalled();
  });
});
