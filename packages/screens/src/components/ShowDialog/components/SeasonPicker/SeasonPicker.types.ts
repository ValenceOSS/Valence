type SeasonPickerSeason = {
  seasonNumber: number | null;
  isHeld: boolean;
};

type SeasonPickerProps = {
  seasons: readonly SeasonPickerSeason[];
  value: number | null;
  onChange: (seasonNumber: number | null) => void;
};

export type { SeasonPickerProps, SeasonPickerSeason };
