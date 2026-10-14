type AniListEntry = {
  id: number;
  malId: number | null;
  format: string | null;
  english: string | null;
  romaji: string | null;
  native: string | null;
  synonyms: string[];
  startDate: string | null;
  episodes: number | null;
  isAiring: boolean;
};

export type { AniListEntry };
