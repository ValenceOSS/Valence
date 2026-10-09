type TheSeasonsProps = {
  tmdbId: number;
  seasons: number[] | null;
  onChange: (seasons: number[] | null) => void;
  followsNew: boolean;
  onFollowsNew: (isOn: boolean) => void;
  alreadyAsked?: readonly number[];
  isFollowedAlready?: boolean;
};

export type { TheSeasonsProps };
