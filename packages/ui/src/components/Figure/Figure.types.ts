type FigureName = 'linkedServers' | 'yours' | 'media' | 'share';

type FigureProps = {
  of: FigureName;
  label?: string;
  className?: string;
};

type FigureLayer = {
  drift: readonly [number, number];
  silhouette?: string;
};

type FigureReach = {
  file: string;
  of: number;
};

type FigurePieceDrawing = {
  lines: string;
  moves: number;
  reach?: FigureReach;
  under: readonly number[];
};

type FigureDrawing = {
  width: number;
  height: number;
  shape: string;
  layers: readonly FigureLayer[];
  pieces: readonly FigurePieceDrawing[];
};

export type {
  FigureDrawing,
  FigureLayer,
  FigureName,
  FigurePieceDrawing,
  FigureProps,
  FigureReach,
};
