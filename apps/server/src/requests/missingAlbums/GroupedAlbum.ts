import type { PlaylistMissingEntry } from '@ValenceContracts/schemas/Playlist';

type GroupedAlbum = { key: string; song: PlaylistMissingEntry; songCount: number };

export type { GroupedAlbum };
