import type { HistoryService } from '@ValenceServer/history/HistoryService';
import type { PlaylistService } from '@ValenceServer/playlists/PlaylistService';
import type { WatchProgressService } from '@ValenceServer/progress/WatchProgressService';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import type { PluginHost } from '@ValenceServer/plugins/broker/PluginHost';
import type { WebhookOccurrence } from '@ValenceServer/events/EventBus';

type Profile = { id: string; name: string; accountId: string };

type CreatePluginHostOptions = {
  readProfile: (profileId: string) => Promise<Profile | null>;
  media: PluginHost['library'] & { findTrack: PluginHost['music']['findTrack'] };
  durationOf: (mediaId: string) => Promise<number | null>;
  progress: WatchProgressService;
  history?: HistoryService | undefined;
  playlists: PlaylistService;
  notify: (accountId: string, note: { title: string; body: string }) => Promise<void>;
  requests: PluginHost['requests'];
  publish: (occurrence: WebhookOccurrence) => Promise<void>;
};

/**
 * What Valence does when a plugin asks, once the broker has decided it may: each call carried out
 * by the same services a person's own client reaches, as that person, so a plugin marking an
 * episode watched or adding to a playlist leaves exactly what the person doing it would.
 *
 * @param options - The services to act through, and how to find a profile's account.
 * @returns The host the broker calls.
 */
const createPluginHost = ({
  readProfile,
  media,
  durationOf,
  progress,
  history,
  playlists,
  notify,
  requests,
  publish,
}: CreatePluginHostOptions): PluginHost => {
  const viewerFor = async (profileId: string): Promise<Viewer> => {
    const profile = await readProfile(profileId);

    if (profile === null) {
      throw new Error('There is no such profile.');
    }

    return {
      kind: 'account',
      accountId: profile.accountId,
      profileId: profile.id,
      isAdministrator: false,
    };
  };

  return {
    profiles: { read: readProfile },
    library: {
      get: media.get,
      search: media.search,
      findByExternalId: media.findByExternalId,
      episodes: media.episodes,
    },
    viewing: {
      progress: async (profileId, since) => {
        const kept = await progress.list(profileId);

        return kept
          .filter((entry) => since === null || entry.updatedAt > since)
          .map((entry) => ({
            mediaId: entry.mediaId,
            positionSeconds: entry.positionSeconds,
            durationSeconds: entry.durationSeconds,
            isFinished: entry.isFinished,
            updatedAt: entry.updatedAt,
          }));
      },
      markWatched: async (profileId, mediaId, watchedAt) => {
        const duration = await durationOf(mediaId);

        if (duration === null) {
          throw new Error('There is no such media item.');
        }

        await progress.record(profileId, {
          mediaId,
          positionSeconds: duration,
          durationSeconds: duration,
          isFinished: true,
        });
        await history?.record(profileId, mediaId, {
          at: watchedAt === null ? new Date() : new Date(watchedAt),
          secondsWatched: 0,
          isFinished: true,
        });
      },
      markUnwatched: (profileId, mediaId) => progress.forget(profileId, mediaId),
    },
    requests,
    playlists: {
      list: async (profileId) =>
        (await playlists.list(await viewerFor(profileId))).map((playlist) => ({
          id: playlist.id,
          name: playlist.name,
        })),
      create: async (profileId, playlist) => {
        const made = await playlists.create(await viewerFor(profileId), {
          name: playlist.name,
          description: playlist.description,
        });

        if (made === null) {
          throw new Error('That playlist could not be made.');
        }

        return { id: made.id };
      },
      add: async (profileId, playlistId, mediaIds) => {
        const added = await playlists.add(await viewerFor(profileId), playlistId, mediaIds);

        if (added === null) {
          throw new Error('There is no such playlist of theirs.');
        }
      },
      read: async (profileId, playlistId) => {
        const found = await playlists.read(await viewerFor(profileId), playlistId);

        return found === null
          ? null
          : {
              id: found.playlist.id,
              name: found.playlist.name,
              entries: found.entries.map((entry) => ({
                entryId: entry.id,
                mediaId: entry.item?.id ?? null,
              })),
            };
      },
      drop: async (profileId, playlistId, entryId) => {
        const dropped = await playlists.drop(await viewerFor(profileId), playlistId, entryId);

        if (!dropped) {
          throw new Error('There is no such entry in a playlist of theirs.');
        }
      },
    },
    music: { findTrack: media.findTrack },
    notifications: {
      send: async (profileId, note) => {
        const profile = await readProfile(profileId);

        if (profile !== null) {
          await notify(profile.accountId, {
            title: `${note.from}: ${note.title}`,
            body: note.body,
          });
        }
      },
    },
    events: {
      emit: (event) => publish({ event: 'plugin.event', data: event }),
    },
  };
};

export { createPluginHost };
