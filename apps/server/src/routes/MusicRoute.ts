import { createRoute, z } from '@hono/zod-openapi';
import {
  AudioQualitySchema,
  LyricsSchema,
  MusicAlbumDetailSchema,
  MusicAlbumListSchema,
  MusicArtistDetailSchema,
  MusicArtistListSchema,
  MusicTrackListSchema,
} from '@ValenceContracts/schemas/Music';
import { MusicSearchSchema } from '@ValenceContracts/schemas/MusicSearch';
import {
  MusicDeviceListSchema,
  ReportNowPlayingSchema,
  SendMusicCommandSchema,
} from '@ValenceContracts/schemas/MusicRemote';
import {
  AddPlaylistEntriesSchema,
  CreatePlaylistSchema,
  MovePlaylistEntrySchema,
  PlaylistDetailSchema,
  PlaylistListSchema,
  PlaylistSummarySchema,
  UpdatePlaylistSchema,
} from '@ValenceContracts/schemas/Playlist';

const MusicError = z.object({ error: z.string() }).openapi('MusicError');

const json = <Schema extends z.ZodType>(description: string, schema: Schema) => ({
  description,
  content: { 'application/json': { schema } },
});

const refused = {
  401: json('Not signed in', MusicError),
  404: json('Not there, or not for you', MusicError),
};

const listAlbumsRoute = createRoute({
  method: 'get',
  path: '/api/music/albums',
  tags: ['Music'],
  summary: 'List the albums in every music library you can see',
  request: {
    query: z.object({
      order: z.enum(['recent', 'title', 'year']).optional(),
      limit: z.coerce.number().int().positive().max(500).optional(),
    }),
  },
  responses: {
    200: json('The albums', MusicAlbumListSchema.openapi('MusicAlbumList')),
    401: json('Not signed in', MusicError),
  },
});

const listArtistsRoute = createRoute({
  method: 'get',
  path: '/api/music/artists',
  tags: ['Music'],
  summary: 'List the artists with an album in a music library you can see, or the ones you follow',
  request: {
    query: z.object({
      favourites: z
        .enum(['true', 'false'])
        .transform((value) => value === 'true')
        .optional(),
      limit: z.coerce.number().int().positive().max(1000).optional(),
    }),
  },
  responses: {
    200: json('The artists', MusicArtistListSchema.openapi('MusicArtistList')),
    401: json('Not signed in', MusicError),
  },
});

const readAlbumRoute = createRoute({
  method: 'get',
  path: '/api/music/albums/{albumId}',
  tags: ['Music'],
  summary: 'Read an album and its tracks',
  request: { params: z.object({ albumId: z.string().uuid() }) },
  responses: {
    200: json('The album', MusicAlbumDetailSchema.openapi('MusicAlbumDetail')),
    ...refused,
  },
});

const readAlbumArtworkRoute = createRoute({
  method: 'get',
  path: '/api/music/albums/{albumId}/artwork',
  tags: ['Music'],
  summary: 'Read an album’s cover',
  request: { params: z.object({ albumId: z.string().uuid() }) },
  responses: { 200: { description: 'The cover' }, ...refused },
});

const readArtistRoute = createRoute({
  method: 'get',
  path: '/api/music/artists/{artistId}',
  tags: ['Music'],
  summary: 'Read an artist, their albums, what they appear on and their best-loved songs',
  request: { params: z.object({ artistId: z.string().uuid() }) },
  responses: {
    200: json('The artist', MusicArtistDetailSchema.openapi('MusicArtistDetail')),
    ...refused,
  },
});

const readArtistImageRoute = createRoute({
  method: 'get',
  path: '/api/music/artists/{artistId}/image',
  tags: ['Music'],
  summary: 'Read an artist’s picture',
  request: { params: z.object({ artistId: z.string().uuid() }) },
  responses: { 200: { description: 'The picture' }, ...refused },
});

const followArtistRoute = createRoute({
  method: 'put',
  path: '/api/music/artists/{artistId}/favourite',
  tags: ['Music'],
  summary: 'Follow an artist',
  request: { params: z.object({ artistId: z.string().uuid() }) },
  responses: {
    200: json('Followed', z.object({ isFavourite: z.boolean() })),
    ...refused,
  },
});

const unfollowArtistRoute = createRoute({
  method: 'delete',
  path: '/api/music/artists/{artistId}/favourite',
  tags: ['Music'],
  summary: 'Stop following an artist',
  request: { params: z.object({ artistId: z.string().uuid() }) },
  responses: {
    200: json('No longer followed', z.object({ isFavourite: z.boolean() })),
    ...refused,
  },
});

const listTracksRoute = createRoute({
  method: 'get',
  path: '/api/music/tracks',
  tags: ['Music'],
  summary: 'Read tracks by id, in the order they were asked for',
  request: {
    query: z.object({
      ids: z
        .string()
        .transform((value) => value.split(',').filter((id) => id !== ''))
        .pipe(z.array(z.string().uuid()).max(1000)),
    }),
  },
  responses: {
    200: json('The tracks', MusicTrackListSchema.openapi('MusicTrackList')),
    401: json('Not signed in', MusicError),
  },
});

const listLikedRoute = createRoute({
  method: 'get',
  path: '/api/music/liked',
  tags: ['Music'],
  summary: 'The songs you have liked, newest first',
  responses: {
    200: json('The songs', MusicTrackListSchema),
    401: json('Not signed in', MusicError),
  },
});

const searchMusicRoute = createRoute({
  method: 'get',
  path: '/api/music/search',
  tags: ['Music'],
  summary: 'Search songs, albums, artists and playlists',
  request: { query: z.object({ q: z.string().max(200) }) },
  responses: {
    200: json('What matched', MusicSearchSchema.openapi('MusicSearch')),
    401: json('Not signed in', MusicError),
  },
});

const readLyricsRoute = createRoute({
  method: 'get',
  path: '/api/music/tracks/{trackId}/lyrics',
  tags: ['Music'],
  summary: 'Read a track’s lyrics, with the time each line is sung where they are synced',
  request: { params: z.object({ trackId: z.string().uuid() }) },
  responses: { 200: json('The lyrics', LyricsSchema.openapi('Lyrics')), ...refused },
});

const streamTrackRoute = createRoute({
  method: 'get',
  path: '/api/music/tracks/{trackId}/stream',
  tags: ['Music'],
  summary: 'Stream a track at a quality, with range requests',
  request: {
    params: z.object({ trackId: z.string().uuid() }),
    query: z.object({ quality: AudioQualitySchema.default('lossless') }),
  },
  responses: {
    200: { description: 'The track' },
    206: { description: 'Part of the track' },
    ...refused,
  },
});

const listDevicesRoute = createRoute({
  method: 'get',
  path: '/api/music/devices',
  tags: ['Music'],
  summary: 'Every copy of Valence your profile has open, and what each is playing',
  responses: {
    200: json('The devices', MusicDeviceListSchema.openapi('MusicDeviceList')),
    401: json('Not signed in', MusicError),
  },
});

const reportNowPlayingRoute = createRoute({
  method: 'post',
  path: '/api/music/devices/now-playing',
  tags: ['Music'],
  summary: 'Say what this device is playing, so your other devices can show and control it',
  request: {
    body: { content: { 'application/json': { schema: ReportNowPlayingSchema } }, required: true },
  },
  responses: {
    200: json('Heard', z.object({ ok: z.boolean() })),
    ...refused,
  },
});

const commandDeviceRoute = createRoute({
  method: 'post',
  path: '/api/music/devices/{clientId}/command',
  tags: ['Music'],
  summary: 'Tell another of your devices to play, pause, skip or take over what is playing',
  request: {
    params: z.object({ clientId: z.string().min(1).max(120) }),
    body: { content: { 'application/json': { schema: SendMusicCommandSchema } }, required: true },
  },
  responses: {
    200: json('Sent', z.object({ ok: z.boolean() })),
    ...refused,
  },
});

const listPlaylistsRoute = createRoute({
  method: 'get',
  path: '/api/playlists',
  tags: ['Playlists'],
  summary: 'Your playlists, and the ones others have shared',
  responses: {
    200: json('The playlists', PlaylistListSchema.openapi('PlaylistList')),
    401: json('Not signed in', MusicError),
  },
});

const createPlaylistRoute = createRoute({
  method: 'post',
  path: '/api/playlists',
  tags: ['Playlists'],
  summary: 'Make a playlist, optionally with things in it already',
  request: {
    body: { content: { 'application/json': { schema: CreatePlaylistSchema } }, required: true },
  },
  responses: {
    201: json('The playlist', PlaylistSummarySchema.openapi('PlaylistSummary')),
    401: json('Not signed in', MusicError),
  },
});

const readPlaylistRoute = createRoute({
  method: 'get',
  path: '/api/playlists/{playlistId}',
  tags: ['Playlists'],
  summary: 'Read a playlist, leaving out anything you may not see',
  request: { params: z.object({ playlistId: z.string().uuid() }) },
  responses: {
    200: json('The playlist', PlaylistDetailSchema.openapi('PlaylistDetail')),
    ...refused,
  },
});

const updatePlaylistRoute = createRoute({
  method: 'patch',
  path: '/api/playlists/{playlistId}',
  tags: ['Playlists'],
  summary: 'Rename, describe, share or order one of your playlists',
  request: {
    params: z.object({ playlistId: z.string().uuid() }),
    body: { content: { 'application/json': { schema: UpdatePlaylistSchema } }, required: true },
  },
  responses: { 200: json('The playlist', PlaylistSummarySchema), ...refused },
});

const removePlaylistRoute = createRoute({
  method: 'delete',
  path: '/api/playlists/{playlistId}',
  tags: ['Playlists'],
  summary: 'Delete one of your playlists',
  request: { params: z.object({ playlistId: z.string().uuid() }) },
  responses: { 200: json('Deleted', z.object({ removed: z.boolean() })), ...refused },
});

const addPlaylistEntriesRoute = createRoute({
  method: 'post',
  path: '/api/playlists/{playlistId}/entries',
  tags: ['Playlists'],
  summary: 'Add to the end of one of your playlists',
  request: {
    params: z.object({ playlistId: z.string().uuid() }),
    body: { content: { 'application/json': { schema: AddPlaylistEntriesSchema } }, required: true },
  },
  responses: { 200: json('How many were added', z.object({ added: z.number() })), ...refused },
});

const movePlaylistEntryRoute = createRoute({
  method: 'patch',
  path: '/api/playlists/{playlistId}/entries/{entryId}',
  tags: ['Playlists'],
  summary: 'Move an entry to just after another, or to the top',
  request: {
    params: z.object({ playlistId: z.string().uuid(), entryId: z.string().uuid() }),
    body: { content: { 'application/json': { schema: MovePlaylistEntrySchema } }, required: true },
  },
  responses: { 200: json('Moved', z.object({ moved: z.boolean() })), ...refused },
});

const dropPlaylistEntryRoute = createRoute({
  method: 'delete',
  path: '/api/playlists/{playlistId}/entries/{entryId}',
  tags: ['Playlists'],
  summary: 'Take an entry out of one of your playlists',
  request: { params: z.object({ playlistId: z.string().uuid(), entryId: z.string().uuid() }) },
  responses: { 200: json('Taken out', z.object({ removed: z.boolean() })), ...refused },
});

export {
  addPlaylistEntriesRoute,
  commandDeviceRoute,
  createPlaylistRoute,
  dropPlaylistEntryRoute,
  followArtistRoute,
  listAlbumsRoute,
  listArtistsRoute,
  listDevicesRoute,
  listLikedRoute,
  listPlaylistsRoute,
  listTracksRoute,
  movePlaylistEntryRoute,
  readAlbumArtworkRoute,
  readAlbumRoute,
  readArtistImageRoute,
  readArtistRoute,
  readLyricsRoute,
  readPlaylistRoute,
  removePlaylistRoute,
  reportNowPlayingRoute,
  searchMusicRoute,
  streamTrackRoute,
  unfollowArtistRoute,
  updatePlaylistRoute,
};
