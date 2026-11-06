type ContentRatingFieldProps = {
  ratings: Readonly<Record<string, string>>;
  region: string;
  onRatingsChange: (ratings: Record<string, string>) => void;
  isDisabled?: boolean;
};

export type { ContentRatingFieldProps };
