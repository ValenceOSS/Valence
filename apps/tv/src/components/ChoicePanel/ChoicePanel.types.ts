type Choice = {
  id: string;
  label: string;
  detail?: string;
  isCurrent: boolean;
  isSet?: boolean;
};

type ChoicePanelProps = {
  title: string;
  choices: readonly Choice[];
  onChoose: (id: string) => void;
  onClose?: () => void;
};

export type { Choice, ChoicePanelProps };
