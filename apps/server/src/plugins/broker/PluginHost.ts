import type {
  CatalogueHit,
  MediaRef,
  MissingSong,
  PlaylistContents,
  ProgressEntry,
} from '@ValenceSDK/host/ValenceHost';

type PluginHost = {
  profiles: {
    read: (profileId: string) => Promise<{ id: string; name: string; accountId: string } | null>;
  };
  library: {
    get: (mediaId: string) => Promise<MediaRef | null>;
    search: (query: string, kinds: readonly MediaRef['kind'][]) => Promise<MediaRef[]>;
    findByExternalId: (source: keyof MediaRef['externalIds'], id: string) => Promise<MediaRef[]>;
    episodes: (seriesId: string) => Promise<MediaRef[]>;
  };
  viewing: {
    progress: (profileId: string, since: string | null) => Promise<ProgressEntry[]>;
    markWatched: (profileId: string, mediaId: string, watchedAt: string | null) => Promise<void>;
    markUnwatched: (profileId: string, mediaId: string) => Promise<void>;
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
    list: (profileId: string) => Promise<{ id: string; name: string }[]>;
    create: (
      profileId: string,
      playlist: { name: string; description: string | null },
    ) => Promise<{ id: string }>;
    add: (
      profileId: string,
      playlistId: string,
      items: readonly (string | MissingSong)[],
    ) => Promise<void>;
    read: (profileId: string, playlistId: string) => Promise<PlaylistContents | null>;
    drop: (profileId: string, playlistId: string, entryId: string) => Promise<void>;
  };
  music: {
    findTrack: (track: {
      title: string;
      artist: string;
      album: string | null;
      isrc: string | null;
    }) => Promise<MediaRef | null>;
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
