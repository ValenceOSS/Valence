import { z } from 'zod';
import { BookContentsSchema } from './Book';

const TYPESET_KINDS = [
  'title',
  'heading',
  'subheading',
  'paragraph',
  'quote',
  'break',
  'picture',
] as const;

const TypesetRunSchema = z.object({
  text: z.string(),
  isItalic: z.boolean(),
  isBold: z.boolean(),
});

const TypesetPictureSchema = z.object({
  address: z.string().min(1),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
});

const TypesetBlockSchema = z.object({
  kind: z.enum(TYPESET_KINDS),
  runs: z.array(TypesetRunSchema),
  anchors: z.array(z.string()),
  picture: TypesetPictureSchema.optional(),
});

const BookTextLineSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('head'), parts: z.number().int().nonnegative() }),
  z.object({
    kind: z.literal('part'),
    part: z.number().int().nonnegative(),
    blocks: z.array(TypesetBlockSchema),
    html: z.string().optional(),
  }),
  z.object({ kind: z.literal('end'), contents: BookContentsSchema.shape.contents }),
]);

type TypesetRun = z.infer<typeof TypesetRunSchema>;

type TypesetPicture = z.infer<typeof TypesetPictureSchema>;

type TypesetBlock = z.infer<typeof TypesetBlockSchema>;

type BookTextLine = z.infer<typeof BookTextLineSchema>;

export type { BookTextLine, TypesetBlock, TypesetPicture, TypesetRun };

export { BookTextLineSchema, TypesetBlockSchema, TypesetPictureSchema, TypesetRunSchema };
