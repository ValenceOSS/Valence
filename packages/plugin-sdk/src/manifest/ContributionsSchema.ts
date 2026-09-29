import { z } from 'zod';
import { IconNameSchema } from '@ValenceSDK/surface/IconNameSchema';
import { PluginThemeSchema } from '@ValenceSDK/theme/PluginThemeSchema';
import { EVENT_TOPICS } from './EVENT_TOPICS';
import { LocalIdSchema } from './LocalIdSchema';

const ContributionsSchema = z.object({
  pages: z
    .array(
      z.object({
        id: LocalIdSchema,
        title: z.string().min(1).max(40),
        placement: z.enum(['account', 'admin']),
        icon: IconNameSchema.optional(),
        requires: LocalIdSchema.optional(),
      }),
    )
    .max(8)
    .default([]),
  panels: z
    .array(
      z.object({
        id: LocalIdSchema,
        title: z.string().min(1).max(40),
        on: z.enum(['title', 'series', 'album', 'artist', 'playlist']),
        requires: LocalIdSchema.optional(),
      }),
    )
    .max(8)
    .default([]),
  themes: z.array(PluginThemeSchema).max(12).default([]),
  schedules: z
    .array(
      z.object({
        id: LocalIdSchema,
        label: z.string().min(1).max(60),
        everyMinutes: z.number().int().min(15).max(10_080),
      }),
    )
    .max(8)
    .default([]),
  events: z.array(z.enum(EVENT_TOPICS)).max(EVENT_TOPICS.length).default([]),
  webhooks: z
    .array(z.object({ id: LocalIdSchema, title: z.string().min(1).max(60) }))
    .max(8)
    .default([]),
  nodes: z
    .array(
      z.object({
        id: LocalIdSchema,
        title: z.string().min(1).max(60),
        description: z.string().max(200).optional(),
      }),
    )
    .max(20)
    .default([]),
});

type Contributions = z.infer<typeof ContributionsSchema>;

export type { Contributions };

export { ContributionsSchema };
