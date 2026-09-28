type PosterMatch = {
  id: string;
  title: string;
  year: number | null;
  detail: string;
  posterUrl: string | null;
};

type PosterMatchListProps = {
  matches: PosterMatch[];
  busyId?: string | null;
  onChoose: (id: string) => void;
};

export type { PosterMatch, PosterMatchListProps };
