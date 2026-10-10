type ChoiceProps = {
  label: string;
  options: readonly { id: string; label: string }[];
  value: string;
  onSelect: (id: string) => void;
  isLabelHidden?: boolean;
};

export type { ChoiceProps };
