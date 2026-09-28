type ShelfItem = {
  id: string;
  name: string;
  year: number | null;
  detail: string;
  cover: string | null;
  isSquare: boolean;
  sizeBytes: number | null;
  addedAt: string;
  onCorrect: (() => void) | null;
  place: { shown: string; folder: string } | null;
};

export type { ShelfItem };
