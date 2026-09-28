import { z } from 'zod';
import { HttpsUrlSchema } from '@ValenceSDK/manifest/HttpsUrlSchema';
import { IconNameSchema } from './IconNameSchema';
import { ImageRefSchema } from './ImageRefSchema';
import { PlainTextSchema } from './PlainTextSchema';
import { SURFACE_LIMITS } from './SURFACE_LIMITS';
import { SurfaceActionSchema } from './SurfaceActionSchema';

const Label = PlainTextSchema(SURFACE_LIMITS.labelLength);

const Words = PlainTextSchema(SURFACE_LIMITS.textLength);

const FieldId = z.string().regex(/^[a-z][a-zA-Z0-9]{0,39}$/);

const RowSchema = z.object({
  type: z.literal('row'),
  label: Label,
  detail: Label.optional(),
  badge: Label.optional(),
  icon: IconNameSchema.optional(),
  image: ImageRefSchema.optional(),
  action: SurfaceActionSchema.optional(),
});

type SurfaceBlock =
  | { type: 'heading'; text: string }
  | { type: 'text'; text: string; tone?: 'default' | 'muted' | 'danger' | 'success' | undefined }
  | {
      type: 'notice';
      tone: 'info' | 'warning' | 'danger' | 'success';
      title?: string | undefined;
      text: string;
    }
  | z.infer<typeof RowSchema>
  | {
      type: 'button';
      label: string;
      action: z.infer<typeof SurfaceActionSchema>;
      tone?: 'primary' | 'secondary' | 'danger' | undefined;
      icon?: z.infer<typeof IconNameSchema> | undefined;
    }
  | { type: 'toggle'; field: string; label: string; value: boolean; help?: string | undefined }
  | {
      type: 'textField';
      field: string;
      label: string;
      value?: string | undefined;
      placeholder?: string | undefined;
      isSecret?: boolean | undefined;
    }
  | {
      type: 'select';
      field: string;
      label: string;
      value?: string | undefined;
      options: { value: string; label: string }[];
    }
  | { type: 'progress'; label?: string | undefined; value: number }
  | { type: 'image'; image: z.infer<typeof ImageRefSchema>; alt: string }
  | { type: 'link'; label: string; url: string }
  | { type: 'media'; mediaId: string }
  | { type: 'divider' }
  | { type: 'section'; title?: string | undefined; children: SurfaceBlock[] }
  | { type: 'list'; title?: string | undefined; rows: z.infer<typeof RowSchema>[] };

const SurfaceBlockSchema: z.ZodType<SurfaceBlock> = z
  .lazy(() =>
    z.discriminatedUnion('type', [
      z.object({ type: z.literal('heading'), text: Label }),
      z.object({
        type: z.literal('text'),
        text: Words,
        tone: z.enum(['default', 'muted', 'danger', 'success']).optional(),
      }),
      z.object({
        type: z.literal('notice'),
        tone: z.enum(['info', 'warning', 'danger', 'success']),
        title: Label.optional(),
        text: Words,
      }),
      RowSchema,
      z.object({
        type: z.literal('button'),
        label: Label,
        action: SurfaceActionSchema,
        tone: z.enum(['primary', 'secondary', 'danger']).optional(),
        icon: IconNameSchema.optional(),
      }),
      z.object({
        type: z.literal('toggle'),
        field: FieldId,
        label: Label,
        value: z.boolean(),
        help: Label.optional(),
      }),
      z.object({
        type: z.literal('textField'),
        field: FieldId,
        label: Label,
        value: Words.optional(),
        placeholder: Label.optional(),
        isSecret: z.boolean().optional(),
      }),
      z.object({
        type: z.literal('select'),
        field: FieldId,
        label: Label,
        value: z.string().max(100).optional(),
        options: z
          .array(z.object({ value: z.string().max(100), label: Label }))
          .min(1)
          .max(50),
      }),
      z.object({
        type: z.literal('progress'),
        label: Label.optional(),
        value: z.number().min(0).max(1),
      }),
      z.object({ type: z.literal('image'), image: ImageRefSchema, alt: Label }),
      z.object({ type: z.literal('link'), label: Label, url: HttpsUrlSchema }),
      z.object({ type: z.literal('media'), mediaId: z.string().uuid() }),
      z.object({ type: z.literal('divider') }),
      z.object({
        type: z.literal('section'),
        title: Label.optional(),
        children: z.array(SurfaceBlockSchema).max(100),
      }),
      z.object({
        type: z.literal('list'),
        title: Label.optional(),
        rows: z.array(RowSchema).max(200),
      }),
    ]),
  )
  .meta({ id: 'PluginSurfaceBlock' });

export type { SurfaceBlock };

export { SurfaceBlockSchema };
