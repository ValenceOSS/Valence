import type { MusicAlbum } from '@ValenceContracts/schemas/Music';

type RecentlyPlayedGridProps = {
  albums: readonly MusicAlbum[];
  newest: readonly MusicAlbum[];
};

export type { RecentlyPlayedGridProps };
