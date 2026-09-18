import type { ReactNode } from 'react';
import type { MusicShelfLayout } from '@ValenceScreens/components/MusicShelf/MusicShelf.types';
import type { MusicArtist } from '@ValenceContracts/schemas/Music';

type ArtistShelfProps = {
  heading: string;
  artists: readonly MusicArtist[];
  layout?: MusicShelfLayout;
  action?: ReactNode;
};

export type { ArtistShelfProps };
