import { z } from 'zod';
import { LetterFontSchema } from './LetterFont';

const SKETCH_SPACE = 1000;

const HexSchema = z.string().regex(/^#[0-9a-f]{6}$/iu);

const PlaceSchema = z
  .number()
  .min(-SKETCH_SPACE)
  .max(SKETCH_SPACE * 2);

const StrokeSchema = z.object({
  kind: z.literal('stroke'),
  tool: z.enum(['pen', 'pencil', 'marker', 'eraser']),
  colour: HexSchema,
  size: z.number().min(1).max(200),
  points: z
    .array(z.tuple([PlaceSchema, PlaceSchema, z.number().min(0).max(1)]))
    .min(1)
    .max(4000),
});

const WordsSchema = z.object({
  kind: z.literal('text'),
  text: z.string().min(1).max(40),
  font: LetterFontSchema,
  colour: HexSchema,
  x: PlaceSchema,
  y: PlaceSchema,
  size: z.number().min(10).max(800),
  turn: z.number().min(-360).max(360),
});

const StickerSchema = z.object({
  kind: z.literal('sticker'),
  sticker: z.string().min(1).max(16),
  x: PlaceSchema,
  y: PlaceSchema,
  size: z.number().min(10).max(1000),
  turn: z.number().min(-360).max(360),
});

const SketchItemSchema = z.discriminatedUnion('kind', [StrokeSchema, WordsSchema, StickerSchema]);

const SketchSceneSchema = z.object({
  background: HexSchema,
  items: z.array(SketchItemSchema).max(400),
});

type SketchScene = z.infer<typeof SketchSceneSchema>;
type SketchItem = z.infer<typeof SketchItemSchema>;
type SketchStroke = z.infer<typeof StrokeSchema>;

export type { SketchItem, SketchScene, SketchStroke };

export { SKETCH_SPACE, SketchSceneSchema, SketchItemSchema };
