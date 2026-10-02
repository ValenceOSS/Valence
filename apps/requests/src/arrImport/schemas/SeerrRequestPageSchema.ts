import { z } from 'zod';

const SeerrUserSchema = z.object({
  id: z.number().int(),
  email: z.string().nullish(),
  displayName: z.string().nullish(),
  username: z.string().nullish(),
  plexUsername: z.string().nullish(),
  plexId: z.number().int().nullish(),
  jellyfinUserId: z.string().nullish(),
  jellyfinUsername: z.string().nullish(),
});

const SeerrRequestSchema = z.object({
  id: z.number().int(),
  status: z.number().int(),
  type: z.string().nullish(),
  is4k: z.boolean().default(false),
  serverId: z.number().int().nullish(),
  rootFolder: z.string().nullish(),
  seasons: z
    .array(z.object({ seasonNumber: z.number().int(), status: z.number().int().default(1) }))
    .default([]),
  media: z.object({
    mediaType: z.string().nullish(),
    tmdbId: z.number().int().nullish(),
    tvdbId: z.number().int().nullish(),
    status: z.number().int().nullish(),
  }),
  requestedBy: SeerrUserSchema.nullish(),
});

const SeerrRequestPageSchema = z.object({
  pageInfo: z.object({ pages: z.number().int().default(1), page: z.number().int().default(1) }),
  results: z.array(SeerrRequestSchema).default([]),
});

type SeerrRequest = z.infer<typeof SeerrRequestSchema>;

type SeerrUser = z.infer<typeof SeerrUserSchema>;

export type { SeerrRequest, SeerrUser };

export { SeerrRequestPageSchema };
