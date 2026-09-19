type SeasonChooserProps = {
  tmdbId: number;
  seasons: number[] | null;
  onChange: (seasons: number[] | null) => void;
};

export type { SeasonChooserProps };
