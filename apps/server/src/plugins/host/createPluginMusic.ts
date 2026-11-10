import { PluginRefusalError } from '@ValenceServer/plugins/broker/PluginRefusalError';
import type { MediaRef } from '@ValenceSDK/host/ValenceHost';
import type { AlbumOrder, MusicService } from '@ValenceServer/music/MusicService';
import type { MusicPlays } from '@ValenceServer/music/mixes/MusicPlays';
import type { ArtistStories } from '@ValenceServer/music/web/createArtistStories';
import type { AppListening } from '@ValenceServer/music/apps/createAppListening';
import type { PluginHost } from '@ValenceServer/plugins/broker/PluginHost';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

type PluginMusicOptions = {
  library: MusicService;
  details: PluginHost['library']['details'];
  findTrack: PluginHost['music']['findTrack'];
  plays: Pick<MusicPlays, 'record'>;
  stories: ArtistStories;
  listening: AppListening;
};

const FEWEST_SECONDS_APART = 30;

const MOST_REMEMBERED = 10_000;

/**
 * The order the music pages call the one a plugin asks for.
 *
 * @param order - The plugin's name for it.
 * @returns The music pages' name for it.
 */
const orderOf = (order: Parameters<PluginHost['music']['albums']>[0]['order']): AlbumOrder => {
  if (order === 'added') {
    return 'recent';
  }

  return order === 'recentlyPlayed' ? 'played' : order;
};

/**
 * What a plugin may ask of the music library for a person: albums in the orders their own music
 * pages offer, genres, lyrics, songs like others, what is known about an artist, and the songs they
 * play in an app outside Valence. Each read goes through the same music service those pages do, so
 * it sees exactly what the person would. A play of a song heard within half its length (and at
 * least 30 seconds) of the last one counted is taken as the same play said again, as an app
 * retrying its scrobble does, and isn't counted twice.
 *
 * @param options - The music service, how to describe what it finds, where plays are kept, what is
 *   known of artists, and where an app's listening is shown.
 * @returns The music part of the plugin host.
 */
const createPluginMusic = ({
  library,
  details,
  findTrack,
  plays,
  stories,
  listening,
}: PluginMusicOptions): PluginHost['music'] => {
  const lastPlayed = new Map<string, number>();

  const refsOf = async (ids: readonly string[], viewer: Viewer): Promise<MediaRef[]> => {
    if (ids.length === 0) {
      return [];
    }

    const found = new Map((await details(ids, viewer)).map((ref) => [ref.id, ref]));

    return ids.flatMap((id) => found.get(id) ?? []);
  };

  return {
    findTrack,
    albums: async (ask, viewer) =>
      refsOf(
        (
          await library.listAlbums(viewer, {
            order: orderOf(ask.order),
            ...(ask.genre === null ? {} : { genre: ask.genre }),
            ...(ask.years === null ? {} : { years: ask.years }),
            offset: ask.offset,
            limit: ask.limit,
          })
        ).map((album) => album.id),
        viewer,
      ),
    genres: (viewer) => library.countGenres(viewer),
    inGenre: async (genre, page, viewer) =>
      refsOf(
        (await library.listInGenre(viewer, genre, page)).map((track) => track.id),
        viewer,
      ),
    lyrics: (trackId, viewer) => library.readLyrics(viewer, trackId),
    similar: async (seedIds, limit, viewer) =>
      refsOf(
        (await library.listPicks(viewer, seedIds, limit)).map((track) => track.id),
        viewer,
      ),
    topSongs: async (artistId, viewer) =>
      refsOf(
        ((await library.readArtist(viewer, artistId))?.popular ?? []).map((track) => track.id),
        viewer,
      ),
    aboutArtist: async (artistId, viewer, mayLookUp) => {
      const artist = await library.readArtist(viewer, artistId);

      if (artist === null) {
        return null;
      }

      const named = { name: artist.artist.name };

      if (!stories.knows(named) && !mayLookUp()) {
        return null;
      }

      const story = await stories.about(
        named,
        [...artist.albums, ...artist.appearsOn].map((album) => album.title),
      );

      return { bio: story.bio, sourceUrl: story.sourceUrl };
    },
    recordPlay: async (profileId, track, playedAtMs) => {
      const key = `${profileId}:${track.id}`;
      const last = lastPlayed.get(key);
      const apartMs = Math.max(FEWEST_SECONDS_APART, (track.durationSeconds ?? 0) / 2) * 1000;

      if (last !== undefined && Math.abs(playedAtMs - last) < apartMs) {
        return;
      }

      lastPlayed.delete(key);
      lastPlayed.set(key, playedAtMs);

      if (lastPlayed.size > MOST_REMEMBERED) {
        const [oldest] = lastPlayed.keys();

        if (oldest !== undefined) {
          lastPlayed.delete(oldest);
        }
      }

      await plays.record(profileId, track.id, playedAtMs);
    },
    nowPlaying: async (app, trackId, viewer) => {
      if (trackId === null) {
        listening.report(app, null);

        return;
      }

      const [track] = await library.listTracks(viewer, [trackId]);

      if (track === undefined) {
        throw new PluginRefusalError('There is no such song.');
      }

      listening.report(app, track);
    },
  };
};

export { createPluginMusic };
