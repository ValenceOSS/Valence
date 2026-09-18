import type { ReactNode } from 'react';
import type { MusicShelfLayout } from '@ValenceScreens/components/MusicShelf/MusicShelf.types';
import type { MusicTileProps } from '@ValenceScreens/components/MusicTile/MusicTile.types';
import type { PlaylistSummary } from '@ValenceContracts/schemas/Playlist';

type PlaylistShelfProps = {
  heading: string;
  playlists: readonly PlaylistSummary[];
  layout?: MusicShelfLayout;
  leading?: MusicTileProps;
  action?: ReactNode;
};

export type { PlaylistShelfProps };
