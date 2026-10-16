import type { LiquidPen, LiquidState } from './LiquidFill.types';

/**
 * Traces a surface across the canvas and down round its foot, curving through the midpoints
 * between surface points so the water reads as smooth rather than a row of facets.
 *
 * @param context - Where to draw.
 * @param heights - How far each point stands above the level.
 * @param top - How far down the canvas the level is, in pixels.
 * @param width - How wide the canvas is.
 * @param bottom - How tall the canvas is.
 * @returns Nothing; the path is left on the context.
 */
const traceSurface = (
  context: LiquidPen,
  heights: readonly number[],
  top: number,
  width: number,
  bottom: number,
): void => {
  const step = width / Math.max(1, heights.length - 1);
  const yOf = (index: number) => top - (heights[index] ?? 0);

  context.beginPath();
  context.moveTo(0, bottom);
  context.lineTo(0, yOf(0));

  for (let index = 1; index < heights.length; index += 1) {
    const midX = (index - 0.5) * step;
    const midY = (yOf(index - 1) + yOf(index)) / 2;

    context.quadraticCurveTo((index - 1) * step, yOf(index - 1), midX, midY);
  }

  context.lineTo(width, yOf(heights.length - 1));
  context.lineTo(width, bottom);
  context.closePath();
};

/**
 * Draws a liquid, ripples and swell together: a fainter body behind, the body in front, and a bright line along its surface
 * where light would catch it. Nothing at all once it has drained.
 *
 * @param context - Where to draw.
 * @param state - The liquid.
 * @param colour - What colour the liquid is, as any colour a canvas reads.
 * @param width - How wide the canvas is, in pixels.
 * @param height - How tall the canvas is, in pixels.
 * @returns Nothing; the canvas is drawn on.
 */
const drawLiquid = (
  context: LiquidPen,
  state: LiquidState,
  colour: string,
  width: number,
  height: number,
): void => {
  context.clearRect(0, 0, width, height);

  if (state.level <= 0.002) {
    return;
  }

  const top = height - Math.min(1.1, state.level) * height;
  const lift = height * 0.04;

  context.fillStyle = colour;
  context.strokeStyle = colour;

  const front = state.heights.map((rise, index) => rise + (state.swell[index] ?? 0));
  const back = state.back.map((rise, index) => rise + (state.backSwell[index] ?? 0));

  context.globalAlpha = 0.28;
  traceSurface(context, back, top - lift, width, height);
  context.fill();

  context.globalAlpha = 0.45;
  traceSurface(context, front, top, width, height);
  context.fill();

  context.globalAlpha = 0.95;
  context.lineWidth = Math.max(1, height * 0.03);
  context.stroke();

  context.globalAlpha = 1;
};

export { drawLiquid };
