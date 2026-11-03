import type { RatingSubject } from '@ValenceClient/library/fetchRatings';

type RatingPanelProps = {
  subject: RatingSubject;
  title: string;
  onRate: (stars: number | null) => void;
  isBare?: boolean;
  className?: string;
};

export type { RatingPanelProps };
