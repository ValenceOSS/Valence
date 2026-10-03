type PanelCardChoiceOption = {
  id: string;
  label: string;
};

type PanelCardChoiceProps = {
  label: string;
  options: readonly PanelCardChoiceOption[];
  value: string;
  onSelect: (id: string) => void;
};

export type { PanelCardChoiceOption, PanelCardChoiceProps };
