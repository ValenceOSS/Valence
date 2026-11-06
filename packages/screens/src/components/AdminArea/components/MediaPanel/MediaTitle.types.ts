import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { TitleRow } from '@ValenceContracts/schemas/TitleList';

type MediaTitle = {
  id: string;
  libraryId: string;
  kind: 'film' | 'version' | 'series' | 'season' | 'episode';
  name: string;
  order: string;
  year: number | null;
  lead: MediaSummary;
  episodes: MediaSummary[];
  parts: MediaTitle[];
  seasons: number;
  sizeBytes: number | null;
  addedAt: string;
  posterFrom: string | null;
  isMatched: boolean;
  row?: TitleRow;
};

export type { MediaTitle };
