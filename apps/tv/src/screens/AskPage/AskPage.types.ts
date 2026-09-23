type AskPageProps = {
  kind: 'film' | 'series';
  id: string;
  onOpenFilm: (mediaId: string) => void;
  onLight: (path: string | null) => void;
};

export type { AskPageProps };
