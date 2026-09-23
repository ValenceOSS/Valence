type TrackChoice = {
  id: string;
  label: string;
};

type TrackMenuProps = {
  title: string;
  choices: readonly TrackChoice[];
  chosen: string;
  onChoose: (id: string) => void;
};

export type { TrackChoice, TrackMenuProps };
