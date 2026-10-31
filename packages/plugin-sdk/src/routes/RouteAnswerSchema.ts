import { z } from 'zod';
import { ROUTE_LIMITS } from './ROUTE_LIMITS';

const ROUTE_CONTENT_TYPES = [
  'application/json',
  'application/xml',
  'text/xml',
  'text/plain',
  'text/csv',
  'text/calendar',
  'application/atom+xml',
  'application/rss+xml',
  'application/opds+json',
] as const;

const Id = z.string().min(1).max(200);

const ServeSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('track'),
      mediaId: Id,
      quality: z.enum(['lossless', 'high', 'normal', 'low']).default('lossless'),
    })
    .strict(),
  z.object({ kind: z.literal('albumArtwork'), albumId: Id }).strict(),
  z.object({ kind: z.literal('artistImage'), artistId: Id }).strict(),
]);

const RouteAnswerSchema = z.union([
  z
    .object({
      status: z
        .number()
        .int()
        .refine(
          (status) =>
            (status >= 200 && status <= 299 && status !== 204 && status !== 205) ||
            (status >= 400 && status <= 599),
        ),
      contentType: z.enum(ROUTE_CONTENT_TYPES),
      body: z.string().max(ROUTE_LIMITS.answerCharacters),
      cacheSeconds: z.number().int().min(0).max(ROUTE_LIMITS.cacheSeconds).optional(),
    })
    .strict(),
  z.object({ serve: ServeSchema }).strict(),
]);

type RouteAnswer = z.infer<typeof RouteAnswerSchema>;

type Serve = z.infer<typeof ServeSchema>;

export type { RouteAnswer, Serve };

export { ROUTE_CONTENT_TYPES, RouteAnswerSchema };
