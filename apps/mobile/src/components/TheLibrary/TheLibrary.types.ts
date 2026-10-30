import type { ReactNode } from 'react';

type TheLibraryProps = {
  onWatch: (mediaId: string, startSeconds: number) => void;
  onLookAt: (mediaId: string) => void;
  onLookAtShow: (libraryId: string, showId: string) => void;
  onAlbum: (albumId: string) => void;
  onArtist: (artistId: string) => void;
  onPlaylist: (playlistId: string) => void;
  onCollection: (collectionId: string) => void;
  onLiked: () => void;
  onMix: (mixId: string) => void;
  onAllAlbums: () => void;
  onAllArtists: () => void;
  onBook: (bookId: string) => void;
  onRead: (bookId: string) => void;
  onListen: (bookId: string) => void;
  side?: 'home' | 'search' | 'calendar';
  searchPage?: (
    header: ReactNode,
    searchingFor: string,
    onScrolled: (isScrolled: boolean) => void,
  ) => ReactNode;
  calendarPage?: (header: ReactNode, onScrolled: (isScrolled: boolean) => void) => ReactNode;
  corner?: ReactNode;
};

export type { TheLibraryProps };
