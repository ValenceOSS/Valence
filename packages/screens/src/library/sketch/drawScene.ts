import { SKETCH_SPACE } from '@ValenceContracts/schemas/SketchScene';
import { LETTER_FONT_LOOKS } from '@ValenceScreens/library/LETTER_FONT_LOOKS';
import type { SketchItem, SketchScene, SketchStroke } from '@ValenceContracts/schemas/SketchScene';

const EMOJI_FONT = "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";

const STROKE_LOOKS: Record<
  SketchStroke['tool'],
  { alpha: number; thickness: number; cap: CanvasLineCap }
> = {
  pen: { alpha: 1, thickness: 1, cap: 'round' },
  pencil: { alpha: 0.72, thickness: 0.55, cap: 'round' },
  marker: { alpha: 0.42, thickness: 1.6, cap: 'square' },
  eraser: { alpha: 1, thickness: 1.4, cap: 'round' },
};

/**
 * Draws one stroke, each stretch of it as thick as the pressure there, so a pen pressed harder
 * draws a heavier line the way ink does.
 *
 * @param paint - Where to draw.
 * @param stroke - The stroke.
 * @param background - The colour an eraser draws with.
 */
const drawStroke = (paint: CanvasRenderingContext2D, stroke: SketchStroke, background: string) => {
  const look = STROKE_LOOKS[stroke.tool];
  const [first] = stroke.points;

  if (first === undefined) {
    return;
  }

  paint.globalAlpha = look.alpha;
  paint.strokeStyle = stroke.tool === 'eraser' ? background : stroke.colour;
  paint.fillStyle = paint.strokeStyle;
  paint.lineCap = look.cap;
  paint.lineJoin = 'round';

  if (stroke.points.length === 1) {
    paint.beginPath();
    paint.arc(first[0], first[1], (stroke.size * look.thickness) / 2, 0, Math.PI * 2);
    paint.fill();

    return;
  }

  if (stroke.tool === 'marker') {
    paint.lineWidth = stroke.size * look.thickness;
    paint.beginPath();
    paint.moveTo(first[0], first[1]);

    for (const [x, y] of stroke.points.slice(1)) {
      paint.lineTo(x, y);
    }

    paint.stroke();

    return;
  }

  for (let at = 1; at < stroke.points.length; at += 1) {
    const from = stroke.points[at - 1];
    const to = stroke.points[at];

    if (from !== undefined && to !== undefined) {
      paint.lineWidth = stroke.size * look.thickness * (0.45 + 0.55 * to[2]);
      paint.beginPath();
      paint.moveTo(from[0], from[1]);
      paint.lineTo(to[0], to[1]);
      paint.stroke();
    }
  }
};

/**
 * Draws one item of a scene in the scene's own units.
 *
 * @param paint - Where to draw.
 * @param item - The item.
 * @param background - The colour an eraser draws with.
 */
const drawItem = (paint: CanvasRenderingContext2D, item: SketchItem, background: string) => {
  paint.save();

  if (item.kind === 'stroke') {
    drawStroke(paint, item, background);
  } else {
    paint.translate(item.x, item.y);
    paint.rotate((item.turn * Math.PI) / 180);
    paint.textAlign = 'center';
    paint.textBaseline = 'middle';

    if (item.kind === 'text') {
      const look = LETTER_FONT_LOOKS[item.font];

      paint.fillStyle = item.colour;
      paint.font = `${look.weight.toString()} ${item.size.toString()}px ${look.family}`;
      paint.fillText(item.text, 0, 0);
    } else {
      paint.font = `${item.size.toString()}px ${EMOJI_FONT}`;
      paint.fillText(item.sticker, 0, item.size * 0.06);
    }
  }

  paint.restore();
};

/**
 * Draws a whole sketch onto a canvas of any size: its background, then every stroke, word and
 * sticker in the order they were added, scaled from the scene's own square to the canvas.
 *
 * @param paint - The canvas to draw on.
 * @param scene - The sketch.
 * @param across - The canvas's width and height in pixels.
 */
const drawScene = (paint: CanvasRenderingContext2D, scene: SketchScene, across: number): void => {
  paint.save();
  paint.setTransform(1, 0, 0, 1, 0, 0);
  paint.clearRect(0, 0, across, across);
  paint.scale(across / SKETCH_SPACE, across / SKETCH_SPACE);
  paint.fillStyle = scene.background;
  paint.fillRect(0, 0, SKETCH_SPACE, SKETCH_SPACE);

  for (const item of scene.items) {
    drawItem(paint, item, scene.background);
  }

  paint.restore();
};

export { drawScene };
