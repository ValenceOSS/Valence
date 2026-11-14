import { z } from 'zod';

const text = z.string().nullish();

const whole = z.number().int().nullish();

const JellyfinPublicInfoSchema = z.object({
  Id: z.string().min(1),
  ServerName: z.string().nullish(),
  Version: z.string().nullish(),
  ProductName: z.string().nullish(),
});

const JellyfinUserSchema = z.object({
  Id: z.string().min(1),
  Name: z.string(),
  ServerId: z.string().nullish(),
  PrimaryImageTag: text,
  Policy: z.object({ IsAdministrator: z.boolean().nullish() }).nullish(),
});

const JellyfinAuthenticationSchema = z.object({
  AccessToken: z.string().min(1),
  ServerId: z.string().nullish(),
  User: JellyfinUserSchema,
});

const JellyfinStreamSchema = z.object({
  Type: z.string(),
  Index: z.number().int(),
  Codec: text,
  Language: text,
  Title: text,
  DisplayTitle: text,
  Channels: whole,
  SampleRate: whole,
  Profile: text,
  IsDefault: z.boolean().nullish(),
  IsForced: z.boolean().nullish(),
  Width: whole,
  Height: whole,
  BitDepth: whole,
  BitRate: whole,
  VideoRangeType: text,
  Level: z.number().nullish(),
  AverageFrameRate: z.number().nullish(),
  IsInterlaced: z.boolean().nullish(),
});

const JellyfinMediaSourceSchema = z.object({
  Id: z.string().min(1),
  Container: text,
  Size: z.number().nullish(),
  Bitrate: whole,
  RunTimeTicks: z.number().nullish(),
  MediaStreams: z.array(JellyfinStreamSchema).nullish(),
  SupportsDirectPlay: z.boolean().nullish(),
  SupportsDirectStream: z.boolean().nullish(),
  TranscodingUrl: text,
});

const JellyfinUserDataSchema = z.object({
  PlaybackPositionTicks: z.number().nullish(),
  Played: z.boolean().nullish(),
  IsFavorite: z.boolean().nullish(),
  LastPlayedDate: text,
  UnplayedItemCount: whole,
});

const JellyfinItemSchema = z.object({
  Id: z.string().min(1),
  Name: z.string().nullish(),
  Type: z.string(),
  SortName: text,
  ParentId: text,
  SeriesId: text,
  SeriesName: text,
  SeasonId: text,
  IndexNumber: whole,
  IndexNumberEnd: whole,
  ParentIndexNumber: whole,
  ProductionYear: whole,
  PremiereDate: text,
  DateCreated: text,
  RunTimeTicks: z.number().nullish(),
  CommunityRating: z.number().nullish(),
  OfficialRating: text,
  Overview: text,
  Taglines: z.array(z.string()).nullish(),
  Genres: z.array(z.string()).nullish(),
  Width: whole,
  Height: whole,
  Container: text,
  CollectionType: text,
  ChildCount: whole,
  RecursiveItemCount: whole,
  ImageTags: z.record(z.string(), z.string()).nullish(),
  BackdropImageTags: z.array(z.string()).nullish(),
  ParentBackdropItemId: text,
  ParentBackdropImageTags: z.array(z.string()).nullish(),
  SeriesPrimaryImageTag: text,
  ParentLogoItemId: text,
  ParentLogoImageTag: text,
  ProviderIds: z.record(z.string(), z.string().nullable()).nullish(),
  People: z
    .array(z.object({ Name: z.string(), Id: z.string().nullish(), Role: text, Type: text }))
    .nullish(),
  UserData: JellyfinUserDataSchema.nullish(),
  MediaSources: z.array(JellyfinMediaSourceSchema).nullish(),
});

const JellyfinItemsSchema = z.object({
  Items: z.array(JellyfinItemSchema),
  TotalRecordCount: z.number().int().nullish(),
});

const JellyfinPlaybackInfoSchema = z.object({
  MediaSources: z.array(JellyfinMediaSourceSchema),
  PlaySessionId: text,
});

type JellyfinItem = z.infer<typeof JellyfinItemSchema>;

type JellyfinMediaSource = z.infer<typeof JellyfinMediaSourceSchema>;

type JellyfinUser = z.infer<typeof JellyfinUserSchema>;

export type { JellyfinItem, JellyfinMediaSource, JellyfinUser };

export {
  JellyfinAuthenticationSchema,
  JellyfinItemSchema,
  JellyfinItemsSchema,
  JellyfinMediaSourceSchema,
  JellyfinPlaybackInfoSchema,
  JellyfinPublicInfoSchema,
  JellyfinUserSchema,
};
