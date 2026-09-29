import type { ReactNode } from 'react';

type TheLibraryProps = {
  onWatch: (mediaId: string, startSeconds: number) => void;
  onLookAt: (mediaId: string) => void;
  onLookAtShow: (libraryId: string, showId: string) => void;
  onNotifications: () => void;
  onScan: () => void;
  onRequested?: () => void;
  onAlbum: (albumId: string) => void;
  onArtist: (artistId: string) => void;
  onPlaylist: (playlistId: string) => void;
  onLiked: () => void;
  onAllAlbums: () => void;
  onAllArtists: () => void;
  onBook: (bookId: string) => void;
  onRead: (bookId: string) => void;
  onListen: (bookId: string) => void;
  side?: 'home' | 'search' | 'downloads' | 'account';
  searchPage?: (
    header: ReactNode,
    searchingFor: string,
    onScrolled: (isScrolled: boolean) => void,
  ) => ReactNode;
  downloadsPage?: (
    header: ReactNode,
    onScrolled: (isScrolled: boolean) => void,
    searchingFor: string,
  ) => ReactNode;
  accountPage?: (
    header: ReactNode,
    onScrolled: (isScrolled: boolean) => void,
    shown: string,
    onShow: (panel: string) => void,
  ) => ReactNode;
};

export type { TheLibraryProps };
