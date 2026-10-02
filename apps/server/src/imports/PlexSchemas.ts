import { z } from 'zod';

const PlexIdentitySchema = z.object({
  MediaContainer: z.object({
    machineIdentifier: z.string(),
    version: z.string().nullish(),
  }),
});

const PlexRootSchema = z.object({
  MediaContainer: z.object({ friendlyName: z.string().nullish() }),
});

const PlexSectionsSchema = z.object({
  MediaContainer: z.object({
    Directory: z
      .array(
        z.object({
          key: z.coerce.string(),
          title: z.string().nullish(),
          type: z.string(),
          Location: z.array(z.object({ path: z.string() })).nullish(),
        }),
      )
      .nullish(),
  }),
});

const PlexMarkerSchema = z.object({
  type: z.string(),
  startTimeOffset: z.number(),
  endTimeOffset: z.number(),
  final: z.boolean().nullish(),
});

const PlexMetadataSchema = z.object({
  ratingKey: z.coerce.string(),
  type: z.string().nullish(),
  title: z.string().nullish(),
  summary: z.string().nullish(),
  year: z.number().int().nullish(),
  guid: z.string().nullish(),
  Guid: z.array(z.object({ id: z.string() })).nullish(),
  index: z.number().int().nullish(),
  parentIndex: z.number().int().nullish(),
  parentRatingKey: z.coerce.string().nullish(),
  grandparentRatingKey: z.coerce.string().nullish(),
  duration: z.number().nullish(),
  addedAt: z.number().nullish(),
  viewCount: z.number().int().nullish(),
  lastViewedAt: z.number().nullish(),
  viewOffset: z.number().nullish(),
  userRating: z.number().nullish(),
  smart: z.union([z.boolean(), z.number(), z.string()]).nullish(),
  playlistType: z.string().nullish(),
  historyKey: z.string().nullish(),
  viewedAt: z.number().nullish(),
  Media: z
    .array(z.object({ Part: z.array(z.object({ file: z.string().nullish() })).nullish() }))
    .nullish(),
  Marker: z.array(PlexMarkerSchema).nullish(),
});

const PlexMetadataPageSchema = z.object({
  MediaContainer: z.object({
    size: z.number().int().nullish(),
    totalSize: z.number().int().nullish(),
    Metadata: z.array(PlexMetadataSchema).nullish(),
  }),
});

const PlexAccountsSchema = z.object({
  MediaContainer: z.object({
    Account: z.array(z.object({ id: z.number().int(), name: z.string().nullish() })).nullish(),
  }),
});

type PlexMetadata = z.infer<typeof PlexMetadataSchema>;

export type { PlexMetadata };

export {
  PlexAccountsSchema,
  PlexIdentitySchema,
  PlexMetadataPageSchema,
  PlexMetadataSchema,
  PlexRootSchema,
  PlexSectionsSchema,
};
