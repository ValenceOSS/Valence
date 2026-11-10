import type {
  AboutArtist,
  AlbumOrder,
  CatalogueHit,
  Genre,
  Kept,
  Lyrics,
  LibraryPage,
  MediaDetails,
  MediaRef,
  MissingSong,
  PlaylistContents,
  ProgressEntry,
  ViewingState,
} from '@ValenceSDK/host/ValenceHost';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import type { App } from '@ValenceServer/music/apps/createAppListening';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { PanelPlace } from '@ValenceSDK/manifest/PanelPlace';

type PluginHost = {
  viewerOf: (profileId: string) => Promise<Viewer>;
  profiles: {
    read: (profileId: string) => Promise<{ id: string; name: string; accountId: string } | null>;
  };
  library: {
    get: (mediaId: string, viewer: Viewer) => Promise<MediaRef | null>;
    search: (
      query: string,
      kinds: readonly MediaRef['kind'][],
      viewer: Viewer,
    ) => Promise<MediaRef[]>;
    findByExternalId: (
      source: keyof MediaRef['externalIds'],
      id: string,
      viewer: Viewer,
    ) => Promise<MediaRef[]>;
    episodes: (seriesId: string, viewer: Viewer) => Promise<MediaRef[]>;
    list: (
      ask: { kind: MediaRef['kind']; after: string | null; limit: number },
      viewer: Viewer,
    ) => Promise<LibraryPage>;
    children: (id: string, viewer: Viewer) => Promise<MediaRef[]>;
    details: (ids: readonly string[], viewer: Viewer) => Promise<MediaDetails[]>;
    sees: (
      subject: { kind: Exclude<PanelPlace, 'playlist'>; id: string },
      viewer: Viewer,
    ) => Promise<boolean>;
  };
  viewing: {
    progress: (profileId: string, since: string | null) => Promise<ProgressEntry[]>;
    markWatched: (profileId: string, mediaId: string, watchedAt: string | null) => Promise<void>;
    markUnwatched: (profileId: string, mediaId: string) => Promise<void>;
    state: (profileId: string, mediaIds: readonly string[]) => Promise<ViewingState[]>;
    favourite: (viewer: Viewer, subject: MediaRef, isFavourite: boolean) => Promise<Kept>;
    rate: (viewer: Viewer, subject: MediaRef, stars: number | null) => Promise<Kept>;
    favourites: (viewer: Viewer, kind: 'track' | 'artist') => Promise<string[]>;
  };
  requests: {
    searchCatalogue: (query: string, kind: CatalogueHit['kind']) => Promise<CatalogueHit[]>;
    create: (
      profileId: string,
      hit: Pick<CatalogueHit, 'catalogueId' | 'kind'>,
    ) => Promise<{ status: 'made' | 'already' | 'refused' }>;
    missingAlbums: (
      profileId: string,
      playlistId: string,
    ) => Promise<{ isMatching: boolean; albums: CatalogueHit[] } | null>;
  };
  playlists: {
    list: (viewer: Viewer) => Promise<{ id: string; name: string }[]>;
    create: (
      viewer: Viewer,
      playlist: { name: string; description: string | null },
    ) => Promise<{ id: string }>;
    add: (
      viewer: Viewer,
      playlistId: string,
      items: readonly (string | MissingSong)[],
    ) => Promise<void>;
    read: (viewer: Viewer, playlistId: string) => Promise<PlaylistContents | null>;
    drop: (viewer: Viewer, playlistId: string, entryId: string) => Promise<void>;
    rename: (
      viewer: Viewer,
      playlistId: string,
      playlist: { name: string; description: string | null },
    ) => Promise<void>;
    remove: (viewer: Viewer, playlistId: string) => Promise<void>;
  };
  music: {
    findTrack: (
      track: { title: string; artist: string; album: string | null; isrc: string | null },
      viewer: Viewer,
    ) => Promise<MediaRef | null>;
    albums: (
      ask: {
        order: AlbumOrder;
        genre: string | null;
        years: { from: number; to: number } | null;
        offset: number;
        limit: number;
      },
      viewer: Viewer,
    ) => Promise<MediaRef[]>;
    genres: (viewer: Viewer) => Promise<Genre[]>;
    inGenre: (
      genre: string,
      page: { offset: number; limit: number },
      viewer: Viewer,
    ) => Promise<MediaRef[]>;
    lyrics: (trackId: string, viewer: Viewer) => Promise<Lyrics | null>;
    similar: (seedIds: readonly string[], limit: number, viewer: Viewer) => Promise<MediaRef[]>;
    topSongs: (artistId: string, viewer: Viewer) => Promise<MediaRef[]>;
    aboutArtist: (
      artistId: string,
      viewer: Viewer,
      mayLookUp: () => boolean,
    ) => Promise<AboutArtist | null>;
    recordPlay: (
      profileId: string,
      track: { id: string; durationSeconds: number | null },
      playedAtMs: number,
    ) => Promise<void>;
    nowPlaying: (app: App, trackId: string | null, viewer: Viewer) => Promise<void>;
  };
  notifications: {
    send: (profileId: string, note: { title: string; body: string; from: string }) => Promise<void>;
  };
  events: {
    emit: (event: {
      pluginId: string;
      pluginName: string;
      name: string;
      title: string;
      detail: Record<string, string | number | boolean | null>;
    }) => Promise<void>;
  };
  jobs: {
    waiting: (pluginId: string) => Promise<number>;
    enqueue: (
      job: { pluginId: string; kind: string; payload: JsonValue; profileId: string | null },
      afterSeconds: number,
      key: string | null,
    ) => Promise<string | null>;
    progress: (jobId: string, pluginName: string, processed: number, total: number) => void;
  };
};

export type { PluginHost };
