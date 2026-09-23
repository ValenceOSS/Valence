type TheLikedSongsProps = {
  onAlbum: (albumId: string) => void;
  onArtist: (artistId: string) => void;
  onPlaylist?: (playlistId: string) => void;
  onBack: () => void;
};

export type { TheLikedSongsProps };
