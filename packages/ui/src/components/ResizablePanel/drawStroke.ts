import type { StrokeShape } from './StrokeShape';

type StrokePen = Pick<
  CanvasRenderingContext2D,
  | 'clearRect'
  | 'beginPath'
  | 'moveTo'
  | 'quadraticCurveTo'
  | 'stroke'
  | 'globalAlpha'
  | 'strokeStyle'
  | 'lineWidth'
  | 'lineCap'
>;

/**
 * Draws the line along a dragged edge, centred in its canvas and bowed by how fast it is moving.
 *
 * @param pen - The canvas's drawing context, already scaled to its device.
 * @param width - The canvas's width in CSS pixels.
 * @param height - Its height in CSS pixels.
 * @param colour - What colour the line is.
 * @param shape - How long, thick, bowed and visible the line is.
 */
const drawStroke = (
  pen: StrokePen,
  width: number,
  height: number,
  colour: string,
  shape: StrokeShape,
) => {
  pen.clearRect(0, 0, width, height);

  if (shape.opacity <= 0) {
    return;
  }

  const middle = width / 2;
  const reach = shape.length / 2;

  pen.globalAlpha = shape.opacity;
  pen.strokeStyle = colour;
  pen.lineWidth = shape.thickness;
  pen.lineCap = 'round';
  pen.beginPath();
  pen.moveTo(middle, height / 2 - reach);
  pen.quadraticCurveTo(middle + shape.bend * 2, height / 2, middle, height / 2 + reach);
  pen.stroke();
};

export { drawStroke };
