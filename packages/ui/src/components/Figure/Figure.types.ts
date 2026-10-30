type FigureName = 'linkedServers' | 'yours' | 'media' | 'share';

type FigureProps = {
  of: FigureName;
  label?: string;
  className?: string;
};

export type { FigureName, FigureProps };
