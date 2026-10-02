import { z } from 'zod';

const MediaBrowserPublicInfoSchema = z.object({
  ServerName: z.string().nullish(),
  Version: z.string().nullish(),
  ProductName: z.string().nullish(),
  Id: z.string().nullish(),
});

const MediaBrowserPolicySchema = z.object({
  IsAdministrator: z.boolean().nullish(),
  IsDisabled: z.boolean().nullish(),
  EnableAllFolders: z.boolean().nullish(),
  EnabledFolders: z.array(z.string()).nullish(),
  BlockedMediaFolders: z.array(z.string()).nullish(),
  MaxParentalRating: z.number().int().nullish(),
  MaxParentalSubRating: z.number().int().nullish(),
  BlockUnratedItems: z.array(z.string()).nullish(),
});

const MediaBrowserUserSchema = z.object({
  Id: z.string(),
  Name: z.string().nullish(),
  PrimaryImageTag: z.string().nullish(),
  Policy: MediaBrowserPolicySchema.nullish(),
});

const MediaBrowserUsersSchema = z.array(MediaBrowserUserSchema);

const MediaBrowserUserQuerySchema = z.object({ Items: z.array(MediaBrowserUserSchema) });

const MediaBrowserFolderSchema = z.object({
  Name: z.string().nullish(),
  Locations: z.array(z.string()).nullish(),
  CollectionType: z.string().nullish(),
  ItemId: z.string().nullish(),
  Id: z.string().nullish(),
  Guid: z.string().nullish(),
});

const MediaBrowserFoldersSchema = z.array(MediaBrowserFolderSchema);

const MediaBrowserFolderQuerySchema = z.object({ Items: z.array(MediaBrowserFolderSchema) });

const MediaBrowserUserDataSchema = z.object({
  Played: z.boolean().nullish(),
  PlayCount: z.number().int().nullish(),
  LastPlayedDate: z.string().nullish(),
  PlaybackPositionTicks: z.number().nullish(),
  IsFavorite: z.boolean().nullish(),
  Rating: z.number().nullish(),
});

const MediaBrowserChapterSchema = z.object({
  StartPositionTicks: z.number(),
  Name: z.string().nullish(),
  MarkerType: z.string().nullish(),
});

const MediaBrowserItemSchema = z.object({
  Id: z.string(),
  Name: z.string().nullish(),
  Type: z.string(),
  Path: z.string().nullish(),
  ProviderIds: z.record(z.string(), z.string().nullable()).nullish(),
  ProductionYear: z.number().int().nullish(),
  IndexNumber: z.number().int().nullish(),
  ParentIndexNumber: z.number().int().nullish(),
  SeriesId: z.string().nullish(),
  AlbumId: z.string().nullish(),
  RunTimeTicks: z.number().nullish(),
  DateCreated: z.string().nullish(),
  Overview: z.string().nullish(),
  UserData: MediaBrowserUserDataSchema.nullish(),
  Chapters: z.array(MediaBrowserChapterSchema).nullish(),
});

const MediaBrowserItemsSchema = z.object({
  Items: z.array(MediaBrowserItemSchema),
  TotalRecordCount: z.number().int().nullish(),
});

const MediaBrowserParentalRatingsSchema = z.array(
  z.object({
    Name: z.string(),
    Value: z.number().nullish(),
    RatingScore: z.object({ score: z.number(), subScore: z.number().nullish() }).nullish(),
  }),
);

const MediaBrowserPlaylistSchema = z.object({
  OpenAccess: z.boolean().nullish(),
  Shares: z.array(z.object({ UserId: z.string() })).nullish(),
});

const MediaBrowserSegmentsSchema = z.object({
  Items: z.array(z.object({ Type: z.string(), StartTicks: z.number(), EndTicks: z.number() })),
});

const IntroSkipperTimestampsSchema = z.object({
  Valid: z.boolean().nullish(),
  IntroStart: z.number(),
  IntroEnd: z.number(),
});

type MediaBrowserItem = z.infer<typeof MediaBrowserItemSchema>;
type MediaBrowserUser = z.infer<typeof MediaBrowserUserSchema>;
type MediaBrowserFolder = z.infer<typeof MediaBrowserFolderSchema>;

export type { MediaBrowserFolder, MediaBrowserItem, MediaBrowserUser };

export {
  IntroSkipperTimestampsSchema,
  MediaBrowserFolderQuerySchema,
  MediaBrowserFoldersSchema,
  MediaBrowserItemSchema,
  MediaBrowserItemsSchema,
  MediaBrowserParentalRatingsSchema,
  MediaBrowserPlaylistSchema,
  MediaBrowserPublicInfoSchema,
  MediaBrowserSegmentsSchema,
  MediaBrowserUserQuerySchema,
  MediaBrowserUsersSchema,
};
