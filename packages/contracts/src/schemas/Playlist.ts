import { z } from 'zod';
import { MediaKindSchema } from './MediaKind';
import { MusicTrackSchema } from './Music';

const PlaylistOwnerSchema = z.object({
  profileId: z.string().uuid(),
  name: z.string(),
  colour: z.string(),
});

const PlaylistSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable(),
  isShared: z.boolean(),
  isOrdered: z.boolean(),
  isMine: z.boolean(),
  owner: PlaylistOwnerSchema.nullable(),
  entryCount: z.number().int().nonnegative(),
  lostCount: z.number().int().nonnegative(),
  durationSeconds: z.number().nonnegative(),
  artworkAlbumIds: z.array(z.string().uuid()).max(4),
  updatedAt: z.string(),
});

const PlaylistItemSchema = z.object({
  id: z.string().uuid(),
  kind: MediaKindSchema,
  title: z.string(),
  subtitle: z.string().nullable(),
  durationSeconds: z.number().nonnegative(),
  track: MusicTrackSchema.nullable(),
});

const PlaylistEntrySchema = z.object({
  id: z.string().uuid(),
  position: z.number(),
  addedAt: z.string(),
  item: PlaylistItemSchema.nullable(),
});

const PlaylistDetailSchema = z.object({
  playlist: PlaylistSummarySchema,
  entries: z.array(PlaylistEntrySchema),
});

const PlaylistListSchema = z.object({ playlists: z.array(PlaylistSummarySchema) });

const CreatePlaylistSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).nullish(),
  isOrdered: z.boolean().optional(),
  mediaItemIds: z.array(z.string().uuid()).max(500).optional(),
});

const UpdatePlaylistSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  isShared: z.boolean().optional(),
  isOrdered: z.boolean().optional(),
});

const AddPlaylistEntriesSchema = z.object({
  mediaItemIds: z.array(z.string().uuid()).min(1).max(500),
});

const MovePlaylistEntrySchema = z.object({
  afterEntryId: z.string().uuid().nullable(),
});

type PlaylistOwner = z.infer<typeof PlaylistOwnerSchema>;
type PlaylistSummary = z.infer<typeof PlaylistSummarySchema>;
type PlaylistItem = z.infer<typeof PlaylistItemSchema>;
type PlaylistEntry = z.infer<typeof PlaylistEntrySchema>;
type PlaylistDetail = z.infer<typeof PlaylistDetailSchema>;
type CreatePlaylist = z.infer<typeof CreatePlaylistSchema>;
type UpdatePlaylist = z.infer<typeof UpdatePlaylistSchema>;

export type {
  CreatePlaylist,
  PlaylistDetail,
  PlaylistEntry,
  PlaylistItem,
  PlaylistOwner,
  PlaylistSummary,
  UpdatePlaylist,
};

export {
  AddPlaylistEntriesSchema,
  CreatePlaylistSchema,
  MovePlaylistEntrySchema,
  PlaylistDetailSchema,
  PlaylistEntrySchema,
  PlaylistItemSchema,
  PlaylistListSchema,
  PlaylistOwnerSchema,
  PlaylistSummarySchema,
  UpdatePlaylistSchema,
};
