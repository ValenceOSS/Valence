import { z } from 'zod';
import { FILED_SOURCES } from '@ValenceContracts/constants/FILED_SOURCES';
import { RECORDED_SOURCES } from '@ValenceContracts/constants/RECORDED_SOURCES';

const MEDIA_SOURCES = [...FILED_SOURCES, ...RECORDED_SOURCES, 'disk'] as const;

const MEDIA_LINKS = ['linked', 'alone'] as const;

const MediaOriginSchema = z.object({
  source: z.enum(MEDIA_SOURCES),
  via: z.string().nullable(),
  link: z.enum(MEDIA_LINKS).nullable(),
});

const MediaOriginsRequestSchema = z.object({
  paths: z.array(z.string().min(1)).min(1).max(500),
});

const MediaOriginsSchema = z.object({
  origins: z.record(z.string(), MediaOriginSchema),
});

const FiledOriginSchema = z.object({
  source: z.enum(FILED_SOURCES),
  via: z.string().nullable(),
});

const FiledOriginsSchema = z.object({
  filed: z.record(z.string(), FiledOriginSchema),
});

type MediaSource = (typeof MEDIA_SOURCES)[number];
type RecordedSource = (typeof RECORDED_SOURCES)[number];
type FiledSource = (typeof FILED_SOURCES)[number];
type MediaLink = (typeof MEDIA_LINKS)[number];
type MediaOrigin = z.infer<typeof MediaOriginSchema>;
type MediaOrigins = z.infer<typeof MediaOriginsSchema>;
type MediaOriginsRequest = z.infer<typeof MediaOriginsRequestSchema>;
type FiledOrigin = z.infer<typeof FiledOriginSchema>;
type FiledOrigins = z.infer<typeof FiledOriginsSchema>;

export type {
  FiledOrigin,
  FiledOrigins,
  FiledSource,
  MediaLink,
  MediaOrigin,
  MediaOrigins,
  MediaOriginsRequest,
  MediaSource,
  RecordedSource,
};

export {
  FiledOriginSchema,
  FiledOriginsSchema,
  MEDIA_LINKS,
  MEDIA_SOURCES,
  MediaOriginSchema,
  MediaOriginsRequestSchema,
  MediaOriginsSchema,
};
