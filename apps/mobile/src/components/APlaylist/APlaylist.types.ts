type APlaylistProps = {
  playlistId: string;
  onAlbum: (albumId: string) => void;
  onArtist: (artistId: string) => void;
  onBack: () => void;
};

export type { APlaylistProps };
