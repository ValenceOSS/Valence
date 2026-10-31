import type {
  CatalogueHit,
  LibraryPage,
  MediaDetails,
  MediaRef,
  MissingSong,
  PlaylistContents,
  ProgressEntry,
  ViewingState,
} from '@ValenceSDK/host/ValenceHost';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

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
      subject: { kind: 'title' | 'series' | 'album' | 'artist'; id: string },
      viewer: Viewer,
    ) => Promise<boolean>;
  };
  viewing: {
    progress: (profileId: string, since: string | null) => Promise<ProgressEntry[]>;
    markWatched: (profileId: string, mediaId: string, watchedAt: string | null) => Promise<void>;
    markUnwatched: (profileId: string, mediaId: string) => Promise<void>;
    state: (profileId: string, mediaIds: readonly string[]) => Promise<ViewingState[]>;
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
  };
  music: {
    findTrack: (
      track: { title: string; artist: string; album: string | null; isrc: string | null },
      viewer: Viewer,
    ) => Promise<MediaRef | null>;
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
};

export type { PluginHost };
