import { Platform } from 'react-native';
import { PaintStyle, Skia, StrokeCap, StrokeJoin, matchFont } from '@shopify/react-native-skia';
import type { SkCanvas } from '@shopify/react-native-skia';
import { SKETCH_SPACE } from '@ValenceContracts/schemas/SketchScene';
import { STROKE_LOOKS } from '@ValenceClient/sketch/STROKE_LOOKS';
import { LETTER_FACES } from '@ValenceMobile/theme/LETTER_FACES';
import type { SketchItem, SketchScene, SketchStroke } from '@ValenceContracts/schemas/SketchScene';

// oxlint-disable-next-line valence/no-hard-coded-strings -- font family names, read by the system
const EMOJI_FAMILY = Platform.OS === 'ios' ? 'Apple Color Emoji' : 'Noto Color Emoji';

/**
 * Draws one stroke as the web draws it: a dot for a single point, one even line for a marker, and
 * otherwise a run of short lines whose width follows the pressure at each point. An eraser paints
 * the background back over what is beneath it.
 *
 * @param canvas - Where to draw.
 * @param stroke - The stroke.
 * @param background - The sketch's background colour.
 */
const drawStroke = (canvas: SkCanvas, stroke: SketchStroke, background: string): void => {
  const look = STROKE_LOOKS[stroke.tool];
  const [first] = stroke.points;

  if (first === undefined) {
    return;
  }

  const paint = Skia.Paint();

  paint.setColor(Skia.Color(stroke.tool === 'eraser' ? background : stroke.colour));
  paint.setAlphaf(look.alpha);
  paint.setAntiAlias(true);

  if (stroke.points.length === 1) {
    canvas.drawCircle(first[0], first[1], (stroke.size * look.thickness) / 2, paint);

    return;
  }

  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeCap(look.cap === 'round' ? StrokeCap.Round : StrokeCap.Square);
  paint.setStrokeJoin(StrokeJoin.Round);

  if (stroke.tool === 'marker') {
    const path = Skia.Path.Make();

    path.moveTo(first[0], first[1]);

    for (const [x, y] of stroke.points.slice(1)) {
      path.lineTo(x, y);
    }

    paint.setStrokeWidth(stroke.size * look.thickness);
    canvas.drawPath(path, paint);

    return;
  }

  for (let at = 1; at < stroke.points.length; at += 1) {
    const from = stroke.points[at - 1];
    const to = stroke.points[at];

    if (from !== undefined && to !== undefined) {
      paint.setStrokeWidth(stroke.size * look.thickness * (0.45 + 0.55 * to[2]));
      canvas.drawLine(from[0], from[1], to[0], to[1], paint);
    }
  }
};

/**
 * Draws one piece of words or one sticker, centred on where it was placed and turned as it was.
 *
 * @param canvas - Where to draw.
 * @param item - The words or sticker.
 */
const drawPlaced = (canvas: SkCanvas, item: Exclude<SketchItem, SketchStroke>): void => {
  const isWords = item.kind === 'text';
  const font = matchFont({
    fontFamily: isWords ? LETTER_FACES[item.font] : EMOJI_FAMILY,
    fontSize: item.size,
  });
  const said = isWords ? item.text : item.sticker;
  const paint = Skia.Paint();

  paint.setColor(Skia.Color(isWords ? item.colour : '#000000'));
  paint.setAntiAlias(true);
  canvas.save();
  canvas.translate(item.x, item.y);
  canvas.rotate(item.turn, 0, 0);
  canvas.drawText(said, -font.measureText(said).width / 2, item.size * 0.35, paint, font);
  canvas.restore();
};

/**
 * Draws a whole sketch at a given size, as the web draws it: the background, then every stroke,
 * piece of words and sticker in order, so the phone shows and saves the same picture.
 *
 * @param canvas - Where to draw.
 * @param scene - The sketch.
 * @param across - How many units wide and high to draw it.
 */
const drawSketchScene = (canvas: SkCanvas, scene: SketchScene, across: number): void => {
  const background = Skia.Paint();

  canvas.save();
  canvas.scale(across / SKETCH_SPACE, across / SKETCH_SPACE);
  background.setColor(Skia.Color(scene.background));
  canvas.drawRect(Skia.XYWHRect(0, 0, SKETCH_SPACE, SKETCH_SPACE), background);

  for (const item of scene.items) {
    if (item.kind === 'stroke') {
      drawStroke(canvas, item, scene.background);
    } else {
      drawPlaced(canvas, item);
    }
  }

  canvas.restore();
};

export { drawSketchScene };
