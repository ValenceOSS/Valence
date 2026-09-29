type TrackChoice = {
  id: string;
  label: string;
  detail?: string;
  isDisabled?: boolean;
};

type TrackMenuProps = {
  title: string;
  choices: readonly TrackChoice[];
  chosen: string;
  onChoose: (id: string) => void;
};

export type { TrackChoice, TrackMenuProps };
