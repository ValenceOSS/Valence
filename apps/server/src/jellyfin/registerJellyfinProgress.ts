import { z } from 'zod';
import { refuse } from '@ValenceI18n/refuse';
import { JsonSchema } from '@ValenceServer/jellyfin/JsonSchema';
import { lowerKeysDeep } from '@ValenceServer/jellyfin/lowerKeysDeep';
import { ItemsQuerySchema, PlaybackReportSchema } from '@ValenceServer/jellyfin/JellyfinRequests';
import { secondsOfTicks } from '@ValenceServer/jellyfin/secondsOfTicks';
import { uuidOfJellyfinId } from '@ValenceServer/jellyfin/uuidOfJellyfinId';
import type { JellyfinApp, JellyfinContext } from '@ValenceServer/jellyfin/JellyfinApp';
import type { JellyfinBackend, JellyfinCaller } from '@ValenceServer/jellyfin/JellyfinBackend';
import type { JellyfinBrowsing } from '@ValenceServer/jellyfin/createJellyfinBrowsing';
import type { JellyfinPlays } from '@ValenceServer/jellyfin/createJellyfinPlays';
import type { JellyfinItem } from '@ValenceServer/jellyfin/JellyfinDtos';

const UserDataBodySchema = z.object({
  played: z.boolean().nullish(),
  isfavorite: z.boolean().nullish(),
  playbackpositionticks: z.number().nonnegative().nullish(),
});

/**
 * Reads a JSON body a Jellyfin app sent, with its names in lower case, or nothing where it sent
 * none that could be read.
 *
 * @param context - The request.
 * @returns The body.
 */
const bodyOf = async (context: JellyfinContext) => {
  const read = JsonSchema.safeParse(await context.req.json().catch(() => null));

  return read.success ? lowerKeysDeep(read.data) : null;
};

/**
 * Registers what Jellyfin apps report about watching, all of it written to Valence's own watch
 * progress for the profile signed in, where Valence's apps see it: where playback got to, that it
 * stopped, and something marked watched or not watched, or kept as a favourite.
 *
 * @param jellyfin - The Jellyfin endpoints.
 * @param backend - What they are answered with.
 * @param browsing - Where an item and everything under it is looked up.
 * @param plays - The playback sessions Jellyfin apps started.
 */
const registerJellyfinProgress = (
  jellyfin: JellyfinApp,
  backend: JellyfinBackend,
  browsing: JellyfinBrowsing,
  plays: JellyfinPlays,
): void => {
  const durationOf = async (caller: JellyfinCaller, mediaId: string): Promise<number | null> =>
    (await backend.getMedia(caller, mediaId))?.durationSeconds ?? null;

  const report =
    (isStop: boolean) =>
    async (context: JellyfinContext): Promise<Response> => {
      const caller = context.get('caller');

      if (caller === null) {
        return context.body(null, 401);
      }

      const read = PlaybackReportSchema.safeParse(await bodyOf(context));

      if (!read.success) {
        return context.body(null, 204);
      }

      const { itemid, playsessionid, positionticks } = read.data;
      const play =
        playsessionid === null || playsessionid === undefined
          ? null
          : plays.read(playsessionid, caller.profile.id);
      const mediaId =
        play?.mediaId ??
        (itemid === null || itemid === undefined ? null : uuidOfJellyfinId(itemid));
      const durationSeconds =
        play?.durationSeconds ?? (mediaId === null ? null : await durationOf(caller, mediaId));

      if (
        mediaId !== null &&
        durationSeconds !== null &&
        positionticks !== null &&
        positionticks !== undefined
      ) {
        await backend.recordProgress(caller, mediaId, {
          positionSeconds: Math.min(secondsOfTicks(positionticks), durationSeconds),
          durationSeconds,
        });
      }

      if (isStop && play !== null && playsessionid !== null && playsessionid !== undefined) {
        await backend.stopPlayback(caller, play.sessionId);
        plays.close(playsessionid);
      }

      return context.body(null, 204);
    };

  jellyfin.post('/sessions/playing', report(false));
  jellyfin.post('/sessions/playing/progress', report(false));
  jellyfin.post('/sessions/playing/stopped', report(true));
  jellyfin.post('/sessions/playing/ping', (context) => context.body(null, 204));

  const mediaUnder = async (caller: JellyfinCaller, item: JellyfinItem): Promise<string[]> => {
    if (!item.IsFolder) {
      const mediaId = uuidOfJellyfinId(item.Id);

      return mediaId === null ? [] : [mediaId];
    }

    const under = await browsing.items(
      caller,
      ItemsQuerySchema.parse({
        parentid: item.Id,
        // oxlint-disable-next-line valence/no-hard-coded-strings -- Jellyfin item kinds, not words for a person
        includeitemtypes: 'Episode,Movie',
        recursive: 'true',
      }),
    );

    return under.Items.flatMap((one) => {
      const mediaId = uuidOfJellyfinId(one.Id);

      return mediaId === null ? [] : [mediaId];
    });
  };

  const changeUserData = async (
    context: JellyfinContext,
    change: { played?: boolean; isFavourite?: boolean; positionTicks?: number },
  ): Promise<Response> => {
    const caller = context.get('caller');

    if (caller === null) {
      return context.body(null, 401);
    }

    const itemId = context.req.param('itemId') ?? '';
    const item = await browsing.item(caller, itemId);

    if (item === null) {
      return context.json(refuse('error.common.noSuchItem'), 404);
    }

    const mediaIds = await mediaUnder(caller, item);

    for (const mediaId of mediaIds) {
      const durationSeconds = await durationOf(caller, mediaId);

      if (change.played === true && durationSeconds !== null) {
        await backend.recordProgress(caller, mediaId, {
          positionSeconds: durationSeconds,
          durationSeconds,
        });
      }

      if (change.played === false) {
        await backend.forgetProgress(caller, mediaId);
      }

      if (
        change.positionTicks !== undefined &&
        change.played === undefined &&
        durationSeconds !== null
      ) {
        await (change.positionTicks === 0
          ? backend.forgetProgress(caller, mediaId)
          : backend.recordProgress(caller, mediaId, {
              positionSeconds: Math.min(secondsOfTicks(change.positionTicks), durationSeconds),
              durationSeconds,
            }));
      }

      if (change.isFavourite !== undefined && !item.IsFolder) {
        await backend.setFavourite(caller, mediaId, change.isFavourite);
      }
    }

    const after = await browsing.item(caller, itemId);

    return context.json(after?.UserData ?? item.UserData ?? {});
  };

  const played = (context: JellyfinContext) => changeUserData(context, { played: true });
  const unplayed = (context: JellyfinContext) => changeUserData(context, { played: false });
  const favourite = (context: JellyfinContext) => changeUserData(context, { isFavourite: true });
  const unfavourite = (context: JellyfinContext) => changeUserData(context, { isFavourite: false });

  jellyfin.post('/users/:userId/playeditems/:itemId', played);
  jellyfin.post('/userplayeditems/:itemId', played);
  jellyfin.delete('/users/:userId/playeditems/:itemId', unplayed);
  jellyfin.delete('/userplayeditems/:itemId', unplayed);
  jellyfin.post('/users/:userId/favoriteitems/:itemId', favourite);
  jellyfin.post('/userfavoriteitems/:itemId', favourite);
  jellyfin.delete('/users/:userId/favoriteitems/:itemId', unfavourite);
  jellyfin.delete('/userfavoriteitems/:itemId', unfavourite);

  const userData = async (context: JellyfinContext): Promise<Response> => {
    const read = UserDataBodySchema.safeParse(await bodyOf(context));

    if (!read.success) {
      return context.json(refuse('error.common.thatCouldNotBeDone'), 400);
    }

    const { played: isPlayed, isfavorite, playbackpositionticks } = read.data;

    return changeUserData(context, {
      ...(isPlayed === null || isPlayed === undefined ? {} : { played: isPlayed }),
      ...(isfavorite === null || isfavorite === undefined ? {} : { isFavourite: isfavorite }),
      ...(playbackpositionticks === null || playbackpositionticks === undefined
        ? {}
        : { positionTicks: playbackpositionticks }),
    });
  };

  const readUserData = async (context: JellyfinContext): Promise<Response> => {
    const caller = context.get('caller');

    if (caller === null) {
      return context.body(null, 401);
    }

    const item = await browsing.item(caller, context.req.param('itemId') ?? '');

    return item === null
      ? context.json(refuse('error.common.noSuchItem'), 404)
      : context.json(item.UserData ?? {});
  };

  jellyfin.post('/users/:userId/items/:itemId/userdata', userData);
  jellyfin.post('/useritems/:itemId/userdata', userData);
  jellyfin.get('/users/:userId/items/:itemId/userdata', readUserData);
  jellyfin.get('/useritems/:itemId/userdata', readUserData);
};

export { registerJellyfinProgress };
