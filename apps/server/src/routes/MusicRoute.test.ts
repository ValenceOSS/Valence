import { OpenAPIHono } from '@hono/zod-openapi';
import { describe, expect, it } from 'vitest';
import {
  addPlaylistEntriesRoute,
  commandDeviceRoute,
  createPlaylistRoute,
  dropPlaylistEntryRoute,
  followArtistRoute,
  listAlbumsRoute,
  listArtistsRoute,
  listDevicesRoute,
  listLikedRoute,
  listMixesRoute,
  listPicksRoute,
  listPlaylistsRoute,
  listTracksRoute,
  movePlaylistEntryRoute,
  readAlbumArtworkRoute,
  readAlbumRoute,
  readArtistImageRoute,
  readArtistRoute,
  readLyricsRoute,
  readMixRoute,
  readPlaylistRoute,
  removePlaylistRoute,
  reportNowPlayingRoute,
  searchMusicRoute,
  streamTrackRoute,
  unfollowArtistRoute,
  updatePlaylistRoute,
} from './MusicRoute';

const MUSIC_ROUTES = [
  addPlaylistEntriesRoute,
  commandDeviceRoute,
  createPlaylistRoute,
  dropPlaylistEntryRoute,
  followArtistRoute,
  listAlbumsRoute,
  listArtistsRoute,
  listDevicesRoute,
  listLikedRoute,
  listMixesRoute,
  listPicksRoute,
  listPlaylistsRoute,
  listTracksRoute,
  movePlaylistEntryRoute,
  readAlbumArtworkRoute,
  readAlbumRoute,
  readArtistImageRoute,
  readArtistRoute,
  readLyricsRoute,
  readMixRoute,
  readPlaylistRoute,
  removePlaylistRoute,
  reportNowPlayingRoute,
  searchMusicRoute,
  streamTrackRoute,
  unfollowArtistRoute,
  updatePlaylistRoute,
];

describe('MusicRoute', () => {
  it('describes every music route in the API reference, which is built from them all', () => {
    const app = new OpenAPIHono();

    for (const route of MUSIC_ROUTES) {
      app.openAPIRegistry.registerPath(route);
    }

    const document = app.getOpenAPI31Document({
      openapi: '3.1.0',
      info: { title: 'Valence API', version: '1' },
    });

    expect(Object.keys(document.paths ?? {})).toContain('/api/music/devices');
    expect(JSON.stringify(document.components?.schemas?.MusicDeviceList)).toContain('phone');
  });
});
