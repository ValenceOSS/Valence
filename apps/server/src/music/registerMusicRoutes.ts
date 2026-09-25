import { say } from '@ValenceI18n/say';
import type { OpenAPIHono } from '@hono/zod-openapi';
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
} from '@ValenceServer/routes/MusicRoute';
import { renditionFor } from './renditionFor';
import { deviceOwnerOf } from '@ValenceServer/devices/deviceOwnerOf';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import type { Permission } from '@ValenceContracts/schemas/Permission';
import type { MusicServices } from './MusicServices';

type MusicRouteOptions = {
  viewerOf: (headers: Headers) => Promise<Viewer | null>;
  music: MusicServices;
  requires: (headers: Headers, permission: Permission) => Promise<boolean>;
};

/**
 * The profile a viewer is acting as, where they are signed in and acting as one.
 *
 * @param viewer - Who is asking.
 * @returns Their profile, or nothing.
 */
const profileOf = (viewer: Viewer | null): string | null =>
  viewer?.kind === 'account' ? viewer.profileId : null;

/**
 * Answers every music and playlist address: browsing, searching, streaming, lyrics, following
 * artists, playlists, and the devices one person can hand playback between.
 *
 * Kept apart from the rest of the application's routes because it is a whole area of its own with
 * one set of services behind it. Everything reads as the viewer asking, so what a restriction keeps
 * from somebody is left out here the same as everywhere else.
 *
 * @param app - The application to add the routes to.
 * @param options - How to tell who is asking, and the services music is read through.
 */
const registerMusicRoutes = (
  app: OpenAPIHono,
  { viewerOf, music, requires }: MusicRouteOptions,
): void => {
  app.openapi(listAlbumsRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const { order, limit } = context.req.valid('query');

    return context.json(
      {
        albums: await music.library.listAlbums(viewer, {
          ...(order === undefined ? {} : { order }),
          ...(limit === undefined ? {} : { limit }),
        }),
      },
      200,
    );
  });

  app.openapi(listArtistsRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const { favourites, limit } = context.req.valid('query');

    return context.json(
      {
        artists: await music.library.listArtists(viewer, {
          ...(favourites === undefined ? {} : { onlyFavourites: favourites }),
          ...(limit === undefined ? {} : { limit }),
        }),
      },
      200,
    );
  });

  app.openapi(readAlbumRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const found = await music.library.readAlbum(viewer, context.req.valid('param').albumId);

    return found === null
      ? context.json({ error: say('server.errors.noSuchAlbum') }, 404)
      : context.json(found, 200);
  });

  app.openapi(readAlbumArtworkRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const path = await music.library.readAlbumArtwork(viewer, context.req.valid('param').albumId);
    const bytes = path === null ? null : await music.readImage(path);

    if (bytes === null) {
      return context.json({ error: say('server.errors.noCoverForAlbum') }, 404);
    }

    return context.body(bytes.slice().buffer, 200, {
      'content-type': 'image/webp',
      'cache-control': 'private, max-age=86400',
    });
  });

  app.openapi(readArtistRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const found = await music.library.readArtist(viewer, context.req.valid('param').artistId);

    return found === null
      ? context.json({ error: say('server.errors.noSuchArtist') }, 404)
      : context.json(found, 200);
  });

  app.openapi(readArtistImageRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const path = await music.library.readArtistImage(viewer, context.req.valid('param').artistId);
    const bytes = path === null ? null : await music.readImage(path);

    if (bytes === null) {
      return context.json({ error: say('server.errors.noPictureOfArtist') }, 404);
    }

    return context.body(bytes.slice().buffer, 200, {
      'content-type': 'image/webp',
      'cache-control': 'private, max-age=86400',
    });
  });

  app.openapi(followArtistRoute, async (context) => {
    const profileId = profileOf(await viewerOf(context.req.raw.headers));

    if (profileId === null) {
      return context.json({ error: say('server.errors.chooseProfileFirst') }, 401);
    }

    const kept = await music.library.keepArtist(profileId, context.req.valid('param').artistId);

    return kept
      ? context.json({ isFavourite: true }, 200)
      : context.json({ error: say('server.errors.noSuchArtist') }, 404);
  });

  app.openapi(unfollowArtistRoute, async (context) => {
    const profileId = profileOf(await viewerOf(context.req.raw.headers));

    if (profileId === null) {
      return context.json({ error: say('server.errors.chooseProfileFirst') }, 401);
    }

    await music.library.dropArtist(profileId, context.req.valid('param').artistId);

    return context.json({ isFavourite: false }, 200);
  });

  app.openapi(listTracksRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    return context.json(
      { tracks: await music.library.listTracks(viewer, context.req.valid('query').ids) },
      200,
    );
  });

  app.openapi(listLikedRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    return context.json({ tracks: await music.library.listLiked(viewer) }, 200);
  });

  app.openapi(searchMusicRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const typed = context.req.valid('query').q.trim().toLowerCase();
    const [found, playlists] = await Promise.all([
      music.library.search(viewer, typed),
      typed === '' ? Promise.resolve([]) : music.playlists.list(viewer),
    ]);

    return context.json(
      {
        ...found,
        playlists: playlists.filter((playlist) => playlist.name.toLowerCase().includes(typed)),
      },
      200,
    );
  });

  app.openapi(readLyricsRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const lyrics = await music.library.readLyrics(viewer, context.req.valid('param').trackId);

    return lyrics === null
      ? context.json({ error: say('server.errors.noLyrics') }, 404)
      : context.json(lyrics, 200);
  });

  app.openapi(streamTrackRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const file = await music.library.readTrackFile(viewer, context.req.valid('param').trackId);

    if (file === null) {
      return context.json({ error: say('server.errors.noSuchTrack') }, 404);
    }

    const streamed = await music.stream(
      file,
      renditionFor(file, context.req.valid('query').quality),
      context.req.header('range') ?? null,
    );

    if (streamed === null) {
      return context.json({ error: say('server.errors.trackUnreadable') }, 404);
    }

    const headers: Record<string, string> = {
      'content-type': streamed.contentType,
      'accept-ranges': 'bytes',
      'cache-control': 'private, max-age=3600',
    };

    if (streamed.contentRange !== null) {
      headers['content-range'] = streamed.contentRange;
    }

    if (streamed.contentLength !== null) {
      headers['content-length'] = streamed.contentLength;
    }

    return context.body(streamed.body, streamed.status === 206 ? 206 : 200, headers);
  });

  app.openapi(listDevicesRoute, async (context) => {
    const listener = deviceOwnerOf(await viewerOf(context.req.raw.headers));

    if (listener === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    return context.json({ devices: music.devices.list(listener) }, 200);
  });

  app.openapi(reportNowPlayingRoute, async (context) => {
    const listener = deviceOwnerOf(await viewerOf(context.req.raw.headers));

    if (listener === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const { clientId, nowPlaying } = context.req.valid('json');

    return music.devices.report(listener, clientId, nowPlaying)
      ? context.json({ ok: true }, 200)
      : context.json({ error: say('server.errors.deviceNotConnected') }, 404);
  });

  app.openapi(commandDeviceRoute, async (context) => {
    const listener = deviceOwnerOf(await viewerOf(context.req.raw.headers));

    if (listener === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const { fromClientId, command } = context.req.valid('json');
    const sent = music.devices.command(
      listener,
      fromClientId,
      context.req.valid('param').clientId,
      command,
    );

    return sent
      ? context.json({ ok: true }, 200)
      : context.json({ error: say('server.errors.deviceNotYours') }, 404);
  });

  app.openapi(listPlaylistsRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    return context.json({ playlists: await music.playlists.list(viewer) }, 200);
  });

  app.openapi(createPlaylistRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (profileOf(viewer) === null || viewer === null) {
      return context.json({ error: say('server.errors.chooseProfileFirst') }, 401);
    }

    const made = await music.playlists.create(viewer, context.req.valid('json'));

    return made === null
      ? context.json({ error: say('server.errors.chooseProfileFirst') }, 401)
      : context.json(made, 201);
  });

  app.openapi(readPlaylistRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const found = await music.playlists.read(viewer, context.req.valid('param').playlistId);

    return found === null
      ? context.json({ error: say('server.errors.noSuchPlaylist') }, 404)
      : context.json(found, 200);
  });

  app.openapi(updatePlaylistRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const changed = await music.playlists.update(
      viewer,
      context.req.valid('param').playlistId,
      context.req.valid('json'),
    );

    return changed === null
      ? context.json({ error: say('server.errors.playlistNotYoursToChange') }, 404)
      : context.json(changed, 200);
  });

  app.openapi(removePlaylistRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const removed = await music.playlists.remove(
      viewer,
      context.req.valid('param').playlistId,
      await requires(context.req.raw.headers, 'account.profiles'),
    );

    return removed
      ? context.json({ removed: true }, 200)
      : context.json({ error: say('server.errors.playlistNotYoursToDelete') }, 404);
  });

  app.openapi(addPlaylistEntriesRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const added = await music.playlists.add(
      viewer,
      context.req.valid('param').playlistId,
      context.req.valid('json').mediaItemIds,
    );

    return added === null
      ? context.json({ error: say('server.errors.playlistNotYoursToChange') }, 404)
      : context.json({ added }, 200);
  });

  app.openapi(movePlaylistEntryRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const { playlistId, entryId } = context.req.valid('param');
    const moved = await music.playlists.move(
      viewer,
      playlistId,
      entryId,
      context.req.valid('json').afterEntryId,
    );

    return moved
      ? context.json({ moved: true }, 200)
      : context.json({ error: say('server.errors.entryNotMoved') }, 404);
  });

  app.openapi(dropPlaylistEntryRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const { playlistId, entryId } = context.req.valid('param');
    const removed = await music.playlists.drop(viewer, playlistId, entryId);

    return removed
      ? context.json({ removed: true }, 200)
      : context.json({ error: say('server.errors.entryNotInYourPlaylist') }, 404);
  });
};

export { registerMusicRoutes };
