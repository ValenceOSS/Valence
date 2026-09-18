import type { ReactNode } from 'react';
import type { MusicShelfLayout } from '@ValenceScreens/components/MusicShelf/MusicShelf.types';
import type { MusicAlbum } from '@ValenceContracts/schemas/Music';

type AlbumShelfProps = {
  heading: string;
  albums: readonly MusicAlbum[];
  detailOf?: (album: MusicAlbum) => string;
  layout?: MusicShelfLayout;
  action?: ReactNode;
};

export type { AlbumShelfProps };
