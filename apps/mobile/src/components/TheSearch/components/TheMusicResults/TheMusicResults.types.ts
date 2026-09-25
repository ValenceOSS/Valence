type TheMusicResultsProps = {
  asked: string;
  isOnItsOwn: boolean;
  onAlbum: (albumId: string) => void;
  onArtist: (artistId: string) => void;
  onPlaylist: (playlistId: string) => void;
};

export type { TheMusicResultsProps };
