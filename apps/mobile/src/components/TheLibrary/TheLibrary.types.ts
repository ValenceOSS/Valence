import type { ReactNode } from 'react';

type TheLibraryProps = {
  onWatch: (mediaId: string, startSeconds: number) => void;
  onLookAt: (mediaId: string) => void;
  onLookAtShow: (libraryId: string, showId: string) => void;
  onNotifications: () => void;
  onScan: () => void;
  onAlbum: (albumId: string) => void;
  onArtist: (artistId: string) => void;
  onPlaylist: (playlistId: string) => void;
  onLiked: () => void;
  onAllAlbums: () => void;
  onAllArtists: () => void;
  onBook: (bookId: string) => void;
  onRead: (bookId: string) => void;
  isSearching?: boolean;
  searchPage?: (
    header: ReactNode,
    searchingFor: string,
    onScrolled: (isScrolled: boolean) => void,
  ) => ReactNode;
};

export type { TheLibraryProps };
