type WallTitle = {
  key: string;
  kind: 'film' | 'show';
  id: string;
  title: string;
  year: number | null;
  poster: string | null;
};

type WallGrid = {
  count: number;
  columns: number;
  rows: number;
  tileWidth: number;
  tileHeight: number;
  stepX: number;
  stepY: number;
};

type WallPoint = { x: number; y: number };

type WallCell = { row: number; column: number };

type WallLens = { least: number; most: number; radius: number };

type WallActions = {
  onClose: () => void;
  onOpenFilm: (mediaId: string) => void;
  onOpenShow: (showId: string) => void;
};

type PosterWallProps = WallActions & {
  isOpen: boolean;
};

export type { PosterWallProps, WallActions, WallCell, WallGrid, WallLens, WallPoint, WallTitle };
