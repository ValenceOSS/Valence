import type { HistoryService } from '@ValenceServer/history/HistoryService';
import { PluginRefusalError } from '@ValenceServer/plugins/broker/PluginRefusalError';
import type { PlaylistService } from '@ValenceServer/playlists/PlaylistService';
import type { WatchProgressService } from '@ValenceServer/progress/WatchProgressService';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import type { PluginHost } from '@ValenceServer/plugins/broker/PluginHost';
import type { WebhookOccurrence } from '@ValenceServer/events/EventBus';

type Profile = { id: string; name: string; accountId: string };

type CreatePluginHostOptions = {
  readProfile: (profileId: string) => Promise<Profile | null>;
  lockedLibraries: () => Promise<readonly string[]>;
  media: PluginHost['library'] & { findTrack: PluginHost['music']['findTrack'] };
  durationOf: (mediaId: string) => Promise<number | null>;
  progress: WatchProgressService;
  viewingState: PluginHost['viewing']['state'];
  history?: HistoryService | undefined;
  playlists: PlaylistService;
  notify: (
    to: { accountId: string; profileId: string },
    note: { title: string; body: string },
  ) => Promise<void>;
  requests: PluginHost['requests'];
  publish: (occurrence: WebhookOccurrence) => Promise<void>;
  jobs: PluginHost['jobs'];
};

/**
 * What Valence does when a plugin asks, once the broker has decided it may: each call carried out
 * by the same services a person's own client reaches, as that person, so a plugin marking an
 * episode watched or adding to a playlist leaves exactly what the person doing it would.
 *
 * @param options - The services to act through, how to find a profile's account, and which
 *   libraries are locked.
 * @returns The host the broker calls.
 */
const createPluginHost = ({
  readProfile,
  lockedLibraries,
  media,
  durationOf,
  progress,
  viewingState,
  history,
  playlists,
  notify,
  requests,
  publish,
  jobs,
}: CreatePluginHostOptions): PluginHost => {
  const viewerFor = async (profileId: string): Promise<Viewer> => {
    const profile = await readProfile(profileId);

    if (profile === null) {
      throw new PluginRefusalError('There is no such profile.');
    }

    const locked = await lockedLibraries();

    return {
      kind: 'account',
      accountId: profile.accountId,
      profileId: profile.id,
      isAdministrator: false,
      ...(locked.length === 0 ? {} : { lockedLibraries: locked }),
    };
  };

  return {
    viewerOf: viewerFor,
    profiles: { read: readProfile },
    library: {
      get: media.get,
      search: media.search,
      findByExternalId: media.findByExternalId,
      episodes: media.episodes,
      list: media.list,
      children: media.children,
      details: media.details,
      sees: media.sees,
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
          throw new PluginRefusalError('There is no such media item.');
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
      state: viewingState,
    },
    requests,
    playlists: {
      list: async (viewer) =>
        (await playlists.list(viewer)).map((playlist) => ({
          id: playlist.id,
          name: playlist.name,
        })),
      create: async (viewer, playlist) => {
        const made = await playlists.create(viewer, {
          name: playlist.name,
          description: playlist.description,
        });

        if (made === null) {
          throw new PluginRefusalError('That playlist could not be made.');
        }

        return { id: made.id };
      },
      add: async (viewer, playlistId, items) => {
        const added = await playlists.add(
          viewer,
          playlistId,
          items.map((item) =>
            typeof item === 'string'
              ? item
              : {
                  title: item.title,
                  artist: item.artist,
                  album: item.album ?? null,
                  releaseId: item.releaseId ?? null,
                },
          ),
        );

        if (added === null) {
          throw new PluginRefusalError('There is no such playlist of theirs.');
        }
      },
      read: async (viewer, playlistId) => {
        const found = await playlists.read(viewer, playlistId);

        return found === null
          ? null
          : {
              id: found.playlist.id,
              name: found.playlist.name,
              entries: found.entries.map((entry) => ({
                entryId: entry.id,
                mediaId: entry.item?.id ?? null,
                missing:
                  entry.missing === null
                    ? null
                    : {
                        title: entry.missing.title,
                        artist: entry.missing.artist,
                        album: entry.missing.album,
                        releaseId: entry.missing.releaseId,
                      },
              })),
            };
      },
      drop: async (viewer, playlistId, entryId) => {
        const dropped = await playlists.drop(viewer, playlistId, entryId);

        if (!dropped) {
          throw new PluginRefusalError('There is no such entry in a playlist of theirs.');
        }
      },
    },
    music: { findTrack: media.findTrack },
    notifications: {
      send: async (profileId, note) => {
        const profile = await readProfile(profileId);

        if (profile !== null) {
          await notify(
            { accountId: profile.accountId, profileId: profile.id },
            {
              title: `${note.from}: ${note.title}`,
              body: note.body,
            },
          );
        }
      },
    },
    events: {
      emit: (event) => publish({ event: 'plugin.event', data: event }),
    },
    jobs,
  };
};

export { createPluginHost };
