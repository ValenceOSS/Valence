type Choice = {
  id: string;
  label: string;
  detail?: string;
  isCurrent: boolean;
};

type ChoicePanelProps = {
  title: string;
  choices: readonly Choice[];
  onChoose: (id: string) => void;
};

export type { Choice, ChoicePanelProps };
