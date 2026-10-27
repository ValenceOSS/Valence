type AskPageProps = {
  kind: 'film' | 'series';
  id: string;
  onOpenFilm: (mediaId: string) => void;
  onPlay?: (mediaId: string) => void;
  onLight: (path: string | null) => void;
};

export type { AskPageProps };
