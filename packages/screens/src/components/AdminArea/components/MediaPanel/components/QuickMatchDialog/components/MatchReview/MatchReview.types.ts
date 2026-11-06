import type { QuickMatchTitle } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/QuickMatchDialog/QuickMatchDialog.types';

type MatchReviewProps = {
  titles: readonly QuickMatchTitle[];
  onMatched: (mediaId: string, to: string) => void;
  onDone: () => void;
};

export type { MatchReviewProps };
