import type { ReactNode } from 'react';

type TheMusicProps = {
  header: ReactNode;
  onAlbum: (albumId: string) => void;
  onArtist: (artistId: string) => void;
  onPlaylist: (playlistId: string) => void;
  onLiked: () => void;
  onMix: (mixId: string) => void;
  onAllAlbums: () => void;
  onAllArtists: () => void;
  onScrolled?: (isScrolled: boolean) => void;
};

export type { TheMusicProps };
