type MissingSongRowProps = {
  number: number;
  title: string;
  artist: string;
  album: string | null;
  coverUrl: string | null;
  showsAlbum: boolean;
  showsArtwork: boolean;
  onChoose?: (() => void) | undefined;
  onRemove?: (() => void) | undefined;
};

export type { MissingSongRowProps };
