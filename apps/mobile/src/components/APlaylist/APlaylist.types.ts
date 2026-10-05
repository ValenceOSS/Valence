type APlaylistProps = {
  playlistId: string;
  isRequestingMissing?: boolean;
  onAlbum: (albumId: string) => void;
  onArtist: (artistId: string) => void;
  onBack: () => void;
};

export type { APlaylistProps };
