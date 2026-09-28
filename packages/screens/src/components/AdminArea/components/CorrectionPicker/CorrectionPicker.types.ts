import type { ReactNode } from 'react';

type CorrectionPickerProps<Match> = {
  title: string | null;
  detail: string;
  searchLabel: string;
  startingQuery: string;
  search: (query: string) => Promise<Match[]>;
  drawMatches: (
    matches: Match[],
    busyId: string | null,
    choose: (match: Match) => void,
  ) => ReactNode;
  keyOf: (match: Match) => string;
  choose: (match: Match) => Promise<string | null>;
  forget: () => Promise<string | null>;
  onChanged: () => void;
  onClose: () => void;
};

export type { CorrectionPickerProps };
